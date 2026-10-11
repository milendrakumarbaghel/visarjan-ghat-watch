package com.ghatwatch.service;

import com.ghatwatch.risk.EventGap;
import com.ghatwatch.risk.EventKey;
import com.ghatwatch.risk.GhatRisk;
import com.ghatwatch.risk.Labels;
import com.ghatwatch.risk.ParameterSummary;
import com.ghatwatch.risk.Scope;
import com.ghatwatch.risk.SuggestedAction;
import com.ghatwatch.web.dto.BriefResponse;
import com.ghatwatch.web.dto.PlanView;
import com.ghatwatch.web.dto.Totals;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Writes the short brief the officer forwards (WhatsApp or print), in English and Hindi.
 * Built from templates over the ranking, so every number in it is one the tool can trace.
 * It states readings against limits only and makes no health claims.
 */
@Service
public class BriefService {

    private static final String[] MONTHS_HI = {"जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
            "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"};
    private static final String[] MONTHS_EN = {"January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"};

    private final GhatWatchService ghatWatch;

    public BriefService(GhatWatchService ghatWatch) {
        this.ghatWatch = ghatWatch;
    }

    public BriefResponse brief(Scope scope) {
        List<GhatRisk> ranked = ghatWatch.rank(scope);
        Map<String, PlanView> plans = ghatWatch.plans();
        LocalDate today = LocalDate.now(GhatWatchService.BHOPAL);
        LocalDate visarjan = ghatWatch.visarjanDate();
        long days = ChronoUnit.DAYS.between(today, visarjan);
        Totals totals = GhatWatchService.totals(ranked);
        return new BriefResponse(scope, today,
                english(scope, ranked, plans, totals, today, visarjan, days),
                hindi(scope, ranked, plans, totals, today, visarjan, days));
    }

    private static String english(Scope scope, List<GhatRisk> ranked, Map<String, PlanView> plans,
                                  Totals t, LocalDate today, LocalDate visarjan, long days) {
        StringBuilder b = new StringBuilder();
        b.append("*Durga Visarjan ").append(visarjan.getYear())
                .append(": ghat water-quality brief, Bhopal*\n");
        b.append("For: BMC visarjan planning. Visarjan: ").append(dateEn(visarjan));
        if (days >= 0) {
            b.append(" (").append(days).append(days == 1 ? " day" : " days").append(" left)");
        }
        b.append(". Prepared: ").append(dateEn(today)).append(".\n\n");

        b.append("Based on MPPCB visarjan water tests at ").append(t.ghats()).append(" ghats, 2023 to 2025 (")
                .append(scope == Scope.DURGA ? "Durga tests only" : "Ganesh and Durga")
                .append("), compared with the CPCB bathing-water limits (class B). ")
                .append("Dissolved oxygen (DO) was below 5 mg/l in ").append(t.doBreaches()).append(" of ")
                .append(t.doTests()).append(" tests; BOD was above 3 mg/l in ").append(t.bodBreaches())
                .append(" of ").append(t.bodTests()).append(" tests.\n\n");

        b.append("*Ghats in order of risk*\n");
        for (GhatRisk g : ranked) {
            b.append(g.rank()).append(". ").append(g.name()).append(": ").append(g.tierLabel().toUpperCase())
                    .append(" (score ").append(Labels.num(g.score())).append("/100)\n");
            List<String> facts = new ArrayList<>();
            facts.add(doFactEn(g.dissolvedOxygen()));
            facts.add(bodFactEn(g.bod()));
            if (g.ph().breaches() > 0) {
                facts.add("pH outside 6.5-8.5 in " + g.ph().breaches() + "/" + g.ph().tests());
            }
            b.append("   ").append(String.join("; ", facts)).append(".\n");
            String gaps = gapsEn(g.coverage().gaps());
            if (!gaps.isEmpty()) {
                b.append("   Data gap: ").append(gaps).append(".\n");
            }
            if (!"high".equalsIgnoreCase(g.siteMatchConfidence())) {
                b.append("   Site name uncertain: reports use two names, may be two places.\n");
            }
            b.append("   ").append(actionsEn(g, plans.get(g.ghatId()))).append("\n");
        }

        b.append("\n*Limits of this data*\n");
        b.append("- A test that was not done is shown as missing, never as clean.\n");
        b.append("- Total coliform, part of the bathing standard, is not tested in these reports.\n");
        b.append("- The reports print no units; standard units are assumed.\n");
        b.append("- This compares readings with limits. It makes no health findings.\n");
        b.append("Source: MPPCB Ganesh and Durga visarjan reports 2023, 2024, 2025. ")
                .append("Every number links to its report page in Visarjan Ghat Watch.");
        return b.toString();
    }

    private static String hindi(Scope scope, List<GhatRisk> ranked, Map<String, PlanView> plans,
                                Totals t, LocalDate today, LocalDate visarjan, long days) {
        StringBuilder b = new StringBuilder();
        b.append("*दुर्गा विसर्जन ").append(visarjan.getYear())
                .append(": घाटों के पानी की गुणवत्ता पर संक्षिप्त रिपोर्ट, भोपाल*\n");
        b.append("किसके लिए: नगर निगम भोपाल, विसर्जन योजना। विसर्जन: ").append(dateHi(visarjan));
        if (days >= 0) {
            b.append(" (").append(days).append(" दिन शेष)");
        }
        b.append("। तैयार: ").append(dateHi(today)).append("।\n\n");

        b.append("आधार: ").append(t.ghats()).append(" घाटों पर MPPCB की विसर्जन जल-जाँच, 2023 से 2025 (")
                .append(scope == Scope.DURGA ? "केवल दुर्गा विसर्जन" : "गणेश और दुर्गा विसर्जन")
                .append("), CPCB स्नान-जल सीमा (श्रेणी B) से तुलना। ")
                .append("घुलित ऑक्सीजन (DO) ").append(t.doTests()).append(" में से ").append(t.doBreaches())
                .append(" जाँचों में 5 mg/l से कम रही; बीओडी (BOD) ").append(t.bodTests()).append(" में से ")
                .append(t.bodBreaches()).append(" जाँचों में 3 mg/l से अधिक रहा।\n\n");

        b.append("*जोखिम के क्रम में घाट*\n");
        for (GhatRisk g : ranked) {
            b.append(g.rank()).append(". ").append(g.nameHi()).append(": ").append(g.tierLabelHi())
                    .append(" जोखिम (स्कोर ").append(Labels.num(g.score())).append("/100)\n");
            List<String> facts = new ArrayList<>();
            facts.add(doFactHi(g.dissolvedOxygen()));
            facts.add(bodFactHi(g.bod()));
            if (g.ph().breaches() > 0) {
                facts.add("pH 6.5-8.5 से बाहर: " + g.ph().tests() + " में से " + g.ph().breaches());
            }
            b.append("   ").append(String.join("; ", facts)).append("।\n");
            String gaps = gapsHi(g.coverage().gaps());
            if (!gaps.isEmpty()) {
                b.append("   आँकड़ों की कमी: ").append(gaps).append("।\n");
            }
            if (!"high".equalsIgnoreCase(g.siteMatchConfidence())) {
                b.append("   स्थान का नाम अनिश्चित: रिपोर्टों में दो नाम हैं, ये दो अलग स्थान हो सकते हैं।\n");
            }
            b.append("   ").append(actionsHi(g, plans.get(g.ghatId()))).append("\n");
        }

        b.append("\n*इन आँकड़ों की सीमाएँ*\n");
        b.append("- जो जाँच नहीं हुई, उसे \"अज्ञात\" दिखाया गया है, कभी \"साफ़\" नहीं।\n");
        b.append("- स्नान-जल मानक का हिस्सा टोटल कोलीफॉर्म इन रिपोर्टों में जाँचा नहीं गया।\n");
        b.append("- रिपोर्टों में इकाइयाँ छपी नहीं हैं; मानक इकाइयाँ मानी गई हैं।\n");
        b.append("- यह केवल सीमा से तुलना है, स्वास्थ्य पर कोई निष्कर्ष नहीं।\n");
        b.append("स्रोत: MPPCB गणेश एवं दुर्गा विसर्जन रिपोर्ट 2023, 2024, 2025। ")
                .append("विसर्जन घाट वॉच में हर आँकड़ा रिपोर्ट के पृष्ठ से जुड़ा है।");
        return b.toString();
    }

    private static String doFactEn(ParameterSummary p) {
        if (p.tests() == 0) {
            return "DO not tested";
        }
        if (p.breaches() == 0) {
            return "DO met the limit in all " + p.tests() + " tests";
        }
        String s = "DO below 5 in " + p.breaches() + "/" + p.tests() + " tests, lowest " + Labels.num(p.worst().value());
        if (p.zeroReadings() > 0) {
            s += " (0 mg/l " + (p.zeroReadings() == 1 ? "once" : p.zeroReadings() + " times") + ")";
        }
        return s;
    }

    private static String doFactHi(ParameterSummary p) {
        if (p.tests() == 0) {
            return "DO की जाँच नहीं हुई";
        }
        if (p.breaches() == 0) {
            return "DO सभी " + p.tests() + " जाँचों में सीमा के भीतर";
        }
        String s = "DO 5 से कम: " + p.tests() + " में से " + p.breaches() + " जाँचें, सबसे कम "
                + Labels.num(p.worst().value());
        if (p.zeroReadings() > 0) {
            s += " (" + p.zeroReadings() + " बार 0 mg/l)";
        }
        return s;
    }

    private static String bodFactEn(ParameterSummary p) {
        if (p.tests() == 0) {
            return "BOD not tested";
        }
        if (p.breaches() == 0) {
            return "BOD met the limit in all " + p.tests() + " tests";
        }
        return "BOD above 3 in " + p.breaches() + "/" + p.tests() + " tests, highest " + Labels.num(p.worst().value());
    }

    private static String bodFactHi(ParameterSummary p) {
        if (p.tests() == 0) {
            return "BOD की जाँच नहीं हुई";
        }
        if (p.breaches() == 0) {
            return "BOD सभी " + p.tests() + " जाँचों में सीमा के भीतर";
        }
        return "BOD 3 से अधिक: " + p.tests() + " में से " + p.breaches() + " जाँचें, सबसे अधिक "
                + Labels.num(p.worst().value());
    }

    private static String gapsEn(List<EventGap> gaps) {
        List<String> parts = new ArrayList<>();
        for (EventGap g : gaps) {
            parts.add((g.noTable() ? "no test for " : "partly tested at ") + g.festival() + " " + g.year());
        }
        return String.join(", ", parts);
    }

    private static String gapsHi(List<EventGap> gaps) {
        List<String> parts = new ArrayList<>();
        for (EventGap g : gaps) {
            String event = new EventKey(g.year(), g.festival()).labelHi();
            parts.add(g.noTable() ? event + " की जाँच नहीं" : event + " की जाँच अधूरी");
        }
        return String.join(", ", parts);
    }

    private static String actionsEn(GhatRisk g, PlanView plan) {
        if (plan != null && plan.saved()) {
            List<String> a = new ArrayList<>();
            if (plan.aeration()) a.add("aeration");
            if (plan.cleaning()) a.add("extra cleaning");
            if (plan.extraTesting()) a.add("extra water testing");
            String text = "Planned: " + (a.isEmpty() ? "no extra action" : String.join(", ", a));
            return plan.note() == null ? text + "." : text + ". Note: " + plan.note();
        }
        List<String> a = g.suggestedActions().stream().map(s -> switch (s.action()) {
            case SuggestedAction.AERATION -> "aeration";
            case SuggestedAction.CLEANING -> "extra cleaning";
            default -> "extra water testing";
        }).toList();
        return "Suggested: " + (a.isEmpty() ? "routine arrangements" : String.join(", ", a)) + ".";
    }

    private static String actionsHi(GhatRisk g, PlanView plan) {
        if (plan != null && plan.saved()) {
            List<String> a = new ArrayList<>();
            if (plan.aeration()) a.add("वातन (एरेशन)");
            if (plan.cleaning()) a.add("अतिरिक्त सफ़ाई");
            if (plan.extraTesting()) a.add("अतिरिक्त जल-जाँच");
            String text = "तय कार्य: " + (a.isEmpty() ? "कोई अतिरिक्त कार्य नहीं" : String.join(", ", a));
            return plan.note() == null ? text + "।" : text + "। टिप्पणी: " + plan.note();
        }
        List<String> a = g.suggestedActions().stream().map(s -> switch (s.action()) {
            case SuggestedAction.AERATION -> "वातन (एरेशन)";
            case SuggestedAction.CLEANING -> "अतिरिक्त सफ़ाई";
            default -> "अतिरिक्त जल-जाँच";
        }).toList();
        return "सुझाव: " + (a.isEmpty() ? "सामान्य व्यवस्था" : String.join(", ", a)) + "।";
    }

    private static String dateEn(LocalDate d) {
        return d.getDayOfMonth() + " " + MONTHS_EN[d.getMonthValue() - 1] + " " + d.getYear();
    }

    private static String dateHi(LocalDate d) {
        return d.getDayOfMonth() + " " + MONTHS_HI[d.getMonthValue() - 1] + " " + d.getYear();
    }
}
