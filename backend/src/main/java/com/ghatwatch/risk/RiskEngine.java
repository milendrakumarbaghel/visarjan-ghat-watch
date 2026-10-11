package com.ghatwatch.risk;

import com.ghatwatch.domain.Ghat;
import com.ghatwatch.domain.Reading;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static com.ghatwatch.risk.BathingLimits.BOD;
import static com.ghatwatch.risk.BathingLimits.DO;
import static com.ghatwatch.risk.BathingLimits.PH;

/**
 * Ranks ghats by how far their readings sit outside the CPCB class B (bathing) limits.
 *
 * <p>Risk score (0 to 100) = 100 x weighted average of the mean severity of each scored
 * parameter: dissolved oxygen 50%, BOD 35%, pH 15%. Dissolved oxygen weighs most because
 * the reports show it reaching 0 mg/l; BOD next because it breaches most often; pH least
 * because it rarely leaves its range. A parameter with no tested reading is left out and
 * the weights of the others are scaled up.
 *
 * <p>Missing readings never lower the score and never count as clean. They are listed as
 * data gaps and drive the "extra testing" suggestion.
 */
public class RiskEngine {

    static final Map<String, Double> WEIGHTS = Map.of(DO, 0.50, BOD, 0.35, PH, 0.15);

    /** Below this, dissolved oxygen also fails CPCB classes C and D (4 mg/l). */
    static final double DO_AERATION_TRIGGER = 4.0;
    /** A drop in dissolved oxygen worth pointing out, mg/l. */
    static final double NOTABLE_DO_DROP = 1.0;

    private final BathingLimits limits;

    public RiskEngine(BathingLimits limits) {
        this.limits = limits;
    }

    public List<GhatRisk> rank(List<Ghat> ghats, List<Reading> readings, Scope scope) {
        return rank(ghats, readings, scope::includes);
    }

    /** Ranks using only the festivals the filter accepts, e.g. one year for the trend chart. */
    public List<GhatRisk> rank(List<Ghat> ghats, List<Reading> readings, Predicate<EventKey> eventFilter) {
        List<Reading> inScope = readings.stream().filter(r -> eventFilter.test(eventOf(r))).toList();
        List<EventKey> events = inScope.stream().map(RiskEngine::eventOf).distinct().sorted().toList();
        Map<String, List<Reading>> byGhat = inScope.stream().collect(Collectors.groupingBy(Reading::getGhatId));

        List<GhatRisk> assessed = ghats.stream()
                .map(g -> assess(g, byGhat.getOrDefault(g.getId(), List.of()), events))
                .sorted(Comparator.comparingDouble(GhatRisk::score).reversed().thenComparing(GhatRisk::name))
                .toList();

        List<GhatRisk> ranked = new ArrayList<>();
        for (int i = 0; i < assessed.size(); i++) {
            ranked.add(assessed.get(i).withRank(i + 1));
        }
        return ranked;
    }

    public static EventKey eventOf(Reading r) {
        return new EventKey(r.getYear(), r.getFestival());
    }

    GhatRisk assess(Ghat ghat, List<Reading> readings, List<EventKey> events) {
        ParameterSummary dissolvedOxygen = summarise(readings, DO);
        ParameterSummary bod = summarise(readings, BOD);
        ParameterSummary ph = summarise(readings, PH);
        double score = score(List.of(dissolvedOxygen, bod, ph));
        Coverage coverage = coverage(readings, events);

        List<Reason> reasons = new ArrayList<>();
        List<Reason> alerts = new ArrayList<>();
        List<Reason> fine = new ArrayList<>();
        for (ParameterSummary p : List.of(dissolvedOxygen, bod, ph)) {
            Reason reason = parameterReason(p, readings);
            (reason.tone().equals("ok") ? fine : alerts).add(reason);
        }
        reasons.addAll(alerts);
        immersionEffect(readings, DO).ifPresent(reasons::add);
        immersionEffect(readings, BOD).ifPresent(reasons::add);
        for (EventGap gap : coverage.gaps()) {
            reasons.add(new Reason("DATA_GAP", "gap", gap.en(), gap.hi(), List.of()));
        }
        if (!"high".equalsIgnoreCase(ghat.getSiteMatchConfidence())) {
            reasons.add(new Reason("SITE_NAME", "info",
                    "Site name is uncertain. " + ghat.getNote(),
                    "स्थान का नाम अनिश्चित है। " + ghat.getNoteHi(), List.of()));
        }
        reasons.addAll(fine);

        Tier tier = Tier.of(score);
        return new GhatRisk(0, ghat.getId(), ghat.getName(), ghat.getNameHi(), ghat.getWaterBody(),
                ghat.getWaterBodyHi(), ghat.getSiteMatchConfidence(), score, tier, tier.label(),
                tier.labelHi(), dissolvedOxygen, bod, ph, reasons,
                suggestActions(ghat, dissolvedOxygen, bod, coverage), coverage);
    }

    ParameterSummary summarise(List<Reading> readings, String parameter) {
        List<Reading> rows = readings.stream().filter(r -> r.getParameter().equals(parameter)).toList();
        List<Reading> tested = rows.stream().filter(r -> !r.isMissing()).toList();
        int breaches = (int) tested.stream().filter(r -> limits.status(r) == ReadingStatus.BREACH).count();
        int zeros = (int) tested.stream().filter(r -> r.getValue() != null && r.getValue().signum() == 0).count();
        double meanSeverity = tested.stream().mapToDouble(limits::severity).average().orElse(0);
        ReadingRef worst = tested.stream().filter(r -> r.getValue() != null)
                .min(worstFirst(parameter))
                .map(ReadingRef::of).orElse(null);
        return new ParameterSummary(parameter, limits.limitText(parameter), tested.size(), breaches,
                rows.size() - tested.size(), zeros, round(meanSeverity, 3), worst);
    }

    /** Orders readings so the one furthest from the limit comes first. */
    private static Comparator<Reading> worstFirst(String parameter) {
        Comparator<Reading> byValue = Comparator.comparing(Reading::getValue);
        return switch (parameter) {
            case DO -> byValue;
            case PH -> Comparator.comparingDouble((Reading r) -> Math.abs(r.getValue().doubleValue() - 7.5)).reversed();
            default -> byValue.reversed();
        };
    }

    double score(List<ParameterSummary> parameters) {
        double weighted = 0;
        double weightUsed = 0;
        for (ParameterSummary p : parameters) {
            if (p.tests() > 0) {
                double w = WEIGHTS.get(p.parameter());
                weighted += w * p.meanSeverity();
                weightUsed += w;
            }
        }
        return weightUsed == 0 ? 0 : round(100 * weighted / weightUsed, 1);
    }

    private Reason parameterReason(ParameterSummary p, List<Reading> readings) {
        String kind = switch (p.parameter()) {
            case DO -> "DISSOLVED_OXYGEN";
            case BOD -> "BOD";
            default -> "PH";
        };
        String name = p.parameter().equals(DO) ? "Dissolved oxygen" : p.parameter();
        String nameHi = Labels.parameterHi(p.parameter());
        String limit = limits.limitText(p.parameter());
        String limitHi = limits.limitTextHi(p.parameter());

        if (p.tests() == 0) {
            return new Reason(kind, "gap",
                    name + ": no test result in the reports for this period. Unknown, not clean.",
                    nameHi + ": इस अवधि की रिपोर्टों में कोई जाँच परिणाम नहीं। स्थिति अज्ञात, इसे साफ़ न मानें।",
                    List.of());
        }

        ReadingRef w = p.worst();
        if (w == null) {
            // Every tested reading was BDL/ND: very low, and nothing to quote.
            return new Reason(kind, "ok",
                    name + " was below the detection limit in all " + p.tests() + " tests.",
                    nameHi + " सभी " + p.tests() + " जाँचों में पता लगाने की सीमा से नीचे रहा।", List.of());
        }
        String unit = p.parameter().equals(PH) ? "" : " mg/l";
        if (p.breaches() == 0) {
            String en = switch (p.parameter()) {
                case DO -> "Dissolved oxygen met the bathing limit (" + limit + ") in all " + p.tests()
                        + " tests. Lowest: " + Labels.num(w.value()) + " mg/l.";
                case BOD -> "BOD met the bathing limit (" + limit + ") in all " + p.tests()
                        + " tests. Highest: " + Labels.num(w.value()) + " mg/l.";
                default -> "pH stayed within " + limit + " in all " + p.tests() + " tests.";
            };
            String hi = switch (p.parameter()) {
                case DO -> "घुलित ऑक्सीजन सभी " + p.tests() + " जाँचों में स्नान-सीमा (" + limitHi
                        + ") के भीतर रही। सबसे कम: " + Labels.num(w.value()) + " mg/l।";
                case BOD -> "बीओडी सभी " + p.tests() + " जाँचों में स्नान-सीमा (" + limitHi
                        + ") के भीतर रहा। सबसे अधिक: " + Labels.num(w.value()) + " mg/l।";
                default -> "पीएच सभी " + p.tests() + " जाँचों में " + limitHi + " के भीतर रहा।";
            };
            return new Reason(kind, "ok", en, hi, List.of(w));
        }

        List<ReadingRef> evidence = readings.stream()
                .filter(r -> r.getParameter().equals(p.parameter()) && limits.status(r) == ReadingStatus.BREACH)
                .sorted(worstFirst(p.parameter()))
                .map(ReadingRef::of)
                .toList();

        String worstText = Labels.num(w.value()) + unit;
        String en;
        String hi;
        switch (p.parameter()) {
            case DO -> {
                en = "Dissolved oxygen was below the bathing limit (" + limit + ") in " + p.breaches()
                        + " of " + p.tests() + " tests. Lowest: " + worstText + " (" + w.where() + ").";
                hi = "घुलित ऑक्सीजन " + p.tests() + " में से " + p.breaches() + " जाँचों में स्नान-सीमा ("
                        + limitHi + ") से कम रही। सबसे कम: " + worstText + " (" + w.whereHi() + ")।";
                if (p.zeroReadings() > 0) {
                    en += " It read 0 mg/l " + times(p.zeroReadings()) + ".";
                    hi += " " + p.zeroReadings() + " बार यह 0 mg/l दर्ज हुई।";
                }
            }
            case BOD -> {
                String ratio = Labels.num(w.value().doubleValue() / limits.bodMax());
                en = "BOD was above the bathing limit (" + limit + ") in " + p.breaches() + " of "
                        + p.tests() + " tests. Highest: " + worstText + " (" + w.where() + "), "
                        + ratio + " times the limit.";
                hi = "बीओडी " + p.tests() + " में से " + p.breaches() + " जाँचों में स्नान-सीमा (" + limitHi
                        + ") से अधिक रहा। सबसे अधिक: " + worstText + " (" + w.whereHi() + "), सीमा का "
                        + ratio + " गुना।";
            }
            default -> {
                en = "pH was outside the bathing range (" + limit + ") in " + p.breaches() + " of "
                        + p.tests() + " tests. Furthest: " + worstText + " (" + w.where() + ").";
                hi = "पीएच " + p.tests() + " में से " + p.breaches() + " जाँचों में " + limitHi
                        + " की सीमा से बाहर रहा। सबसे दूर: " + worstText + " (" + w.whereHi() + ")।";
            }
        }
        return new Reason(kind, "alert", en, hi, evidence);
    }

    /** The largest change from before to during immersion, if it is worth mentioning. */
    private Optional<Reason> immersionEffect(List<Reading> readings, String parameter) {
        Map<EventKey, Map<String, Reading>> byEvent = new LinkedHashMap<>();
        readings.stream()
                .filter(r -> r.getParameter().equals(parameter) && r.getValue() != null)
                .forEach(r -> byEvent.computeIfAbsent(eventOf(r), k -> new LinkedHashMap<>()).put(r.getPhase(), r));

        Map<String, Reading> best = null;
        double bestChange = 0;
        for (Map<String, Reading> phases : byEvent.values()) {
            Reading pre = phases.get("pre");
            Reading during = phases.get("during");
            if (pre == null || during == null) {
                continue;
            }
            double change = during.getValue().doubleValue() - pre.getValue().doubleValue();
            // Worse means oxygen falling, or BOD rising.
            double worsening = parameter.equals(DO) ? -change : change;
            if (worsening > bestChange) {
                bestChange = worsening;
                best = phases;
            }
        }
        double notable = parameter.equals(DO) ? NOTABLE_DO_DROP : limits.bodMax();
        if (best == null || bestChange < notable) {
            return Optional.empty();
        }

        Reading pre = best.get("pre");
        Reading during = best.get("during");
        Reading after = best.get("after");
        EventKey event = eventOf(pre);
        String en;
        String hi;
        if (parameter.equals(DO)) {
            en = "Immersion effect: at " + event.label() + ", dissolved oxygen fell from "
                    + Labels.num(pre.getValue()) + " mg/l before immersion to " + Labels.num(during.getValue())
                    + " mg/l during immersion";
            hi = "विसर्जन का असर: " + event.labelHi() + " में घुलित ऑक्सीजन विसर्जन से पहले "
                    + Labels.num(pre.getValue()) + " mg/l थी, विसर्जन के दौरान " + Labels.num(during.getValue())
                    + " mg/l रह गई";
        } else {
            en = "Immersion effect: at " + event.label() + ", BOD rose from " + Labels.num(pre.getValue())
                    + " mg/l before immersion to " + Labels.num(during.getValue()) + " mg/l during immersion";
            hi = "विसर्जन का असर: " + event.labelHi() + " में बीओडी विसर्जन से पहले "
                    + Labels.num(pre.getValue()) + " mg/l था, विसर्जन के दौरान " + Labels.num(during.getValue())
                    + " mg/l हो गया";
        }
        if (after != null) {
            en += ", and was " + Labels.num(after.getValue()) + " mg/l one week after";
            hi += ", और एक सप्ताह बाद " + Labels.num(after.getValue()) + " mg/l";
        }
        List<ReadingRef> evidence = new ArrayList<>(List.of(ReadingRef.of(pre), ReadingRef.of(during)));
        if (after != null) {
            evidence.add(ReadingRef.of(after));
        }
        return Optional.of(new Reason("IMMERSION_EFFECT", "info", en + ".", hi + "।", evidence));
    }

    Coverage coverage(List<Reading> readings, List<EventKey> events) {
        List<EventGap> gaps = new ArrayList<>();
        int expected = events.size() * Labels.PHASES.size() * BathingLimits.SCORED.size();
        int present = 0;
        int eventsWithData = 0;

        for (EventKey event : events) {
            List<Reading> rows = readings.stream()
                    .filter(r -> eventOf(r).equals(event) && BathingLimits.SCORED.contains(r.getParameter()))
                    .toList();
            if (rows.isEmpty()) {
                gaps.add(new EventGap(event.year(), event.festival(), true, List.of(),
                        event.label() + ": the report has no table for this ghat. Water quality unknown.",
                        event.labelHi() + ": रिपोर्ट में इस घाट की कोई तालिका नहीं है। पानी की स्थिति अज्ञात।"));
                continue;
            }
            eventsWithData++;

            // missing[parameter] = phases with no usable reading for it
            Map<String, List<String>> missing = new LinkedHashMap<>();
            for (String parameter : BathingLimits.SCORED) {
                for (String phase : Labels.PHASES) {
                    boolean has = rows.stream().anyMatch(r -> r.getParameter().equals(parameter)
                            && r.getPhase().equals(phase) && !r.isMissing());
                    if (has) {
                        present++;
                    } else {
                        missing.computeIfAbsent(parameter, k -> new ArrayList<>()).add(phase);
                    }
                }
            }
            if (!missing.isEmpty()) {
                gaps.add(describeGap(event, missing));
            }
        }
        return Coverage.of(events.size(), eventsWithData, expected, present, gaps);
    }

    private static EventGap describeGap(EventKey event, Map<String, List<String>> missing) {
        List<String> codes = new ArrayList<>();
        missing.forEach((parameter, phases) -> phases.forEach(phase -> codes.add(parameter + "/" + phase)));

        boolean samePhasesForAll = missing.size() == BathingLimits.SCORED.size()
                && missing.values().stream().distinct().count() == 1;
        String en;
        String hi;
        if (samePhasesForAll) {
            List<String> phases = missing.values().iterator().next();
            en = event.label() + ": not sampled " + join(phases.stream().map(Labels::phase).toList(), " and ") + ".";
            hi = event.labelHi() + ": " + join(phases.stream().map(Labels::phaseHi).toList(), " और ")
                    + " नमूना नहीं लिया गया।";
        } else {
            List<String> partsEn = new ArrayList<>();
            List<String> partsHi = new ArrayList<>();
            missing.forEach((parameter, phases) -> {
                String name = parameter.equals(DO) ? "dissolved oxygen" : parameter;
                partsEn.add(name + " not sampled (" + join(phases.stream().map(Labels::phase).toList(), ", ") + ")");
                partsHi.add(Labels.parameterHi(parameter) + " का नमूना नहीं लिया गया ("
                        + join(phases.stream().map(Labels::phaseHi).toList(), ", ") + ")");
            });
            en = event.label() + ": " + String.join("; ", partsEn) + ".";
            hi = event.labelHi() + ": " + String.join("; ", partsHi) + "।";
        }
        return new EventGap(event.year(), event.festival(), false, codes, en, hi);
    }

    private List<SuggestedAction> suggestActions(Ghat ghat, ParameterSummary dissolvedOxygen,
                                                 ParameterSummary bod, Coverage coverage) {
        List<SuggestedAction> actions = new ArrayList<>();

        ReadingRef lowest = dissolvedOxygen.worst();
        boolean veryLowOxygen = lowest != null && lowest.value().doubleValue() < DO_AERATION_TRIGGER;
        boolean oftenLowOxygen = dissolvedOxygen.tests() > 0 && dissolvedOxygen.breaches() * 3 >= dissolvedOxygen.tests();
        if (veryLowOxygen || oftenLowOxygen) {
            actions.add(new SuggestedAction(SuggestedAction.AERATION,
                    "Dissolved oxygen fell to " + Labels.num(lowest.value()) + " mg/l; " + dissolvedOxygen.breaches()
                            + " of " + dissolvedOxygen.tests() + " tests below " + Labels.num(limits.doMin()) + ".",
                    "घुलित ऑक्सीजन " + Labels.num(lowest.value()) + " mg/l तक गिरी; " + dissolvedOxygen.tests()
                            + " में से " + dissolvedOxygen.breaches() + " जाँचें " + Labels.num(limits.doMin()) + " से कम।"));
        }

        if (bod.tests() > 0 && bod.breaches() * 2 >= bod.tests()) {
            actions.add(new SuggestedAction(SuggestedAction.CLEANING,
                    "BOD (organic waste) above " + Labels.num(limits.bodMax()) + " mg/l in " + bod.breaches() + " of "
                            + bod.tests() + " tests. Remove flowers, idols and offerings from the water quickly.",
                    "बीओडी (जैविक कचरा) " + bod.tests() + " में से " + bod.breaches() + " जाँचों में "
                            + Labels.num(limits.bodMax()) + " mg/l से अधिक। फूल, मूर्तियाँ और पूजा-सामग्री पानी से जल्दी निकालें।"));
        }

        boolean uncertainSite = !"high".equalsIgnoreCase(ghat.getSiteMatchConfidence());
        if (!coverage.gaps().isEmpty() || uncertainSite) {
            String events = join(coverage.gaps().stream().map(g -> g.festival() + " " + g.year()).toList(), ", ");
            String eventsHi = join(coverage.gaps().stream()
                    .map(g -> new EventKey(g.year(), g.festival()).labelHi()).toList(), ", ");
            String why = events.isEmpty() ? "" : "Tests missing for " + events + ". ";
            String whyHi = eventsHi.isEmpty() ? "" : eventsHi + " की जाँच अधूरी है। ";
            if (uncertainSite) {
                why += "Site name is uncertain; record the exact sampling point. ";
                whyHi += "स्थान का नाम अनिश्चित है; नमूने की सही जगह दर्ज करें। ";
            }
            actions.add(new SuggestedAction(SuggestedAction.EXTRA_TESTING,
                    why + "Test before, during and one week after this visarjan.",
                    whyHi + "इस विसर्जन में पहले, दौरान और एक सप्ताह बाद जाँच कराएँ।"));
        }
        return actions;
    }

    private static String times(int n) {
        return n == 1 ? "once" : n + " times";
    }

    private static String join(List<String> items, String separator) {
        return String.join(separator, items);
    }

    private static double round(double value, int places) {
        double factor = Math.pow(10, places);
        return Math.round(value * factor) / factor;
    }
}
