package com.ghatwatch.service;

import com.ghatwatch.domain.ActionPlan;
import com.ghatwatch.domain.Ghat;
import com.ghatwatch.domain.Reading;
import com.ghatwatch.report.ReportCatalog;
import com.ghatwatch.repository.ActionPlanRepository;
import com.ghatwatch.repository.CpcbCriterionRepository;
import com.ghatwatch.repository.FieldReadingRepository;
import com.ghatwatch.repository.GhatRepository;
import com.ghatwatch.repository.ReadingRepository;
import com.ghatwatch.risk.BathingLimits;
import com.ghatwatch.risk.EventKey;
import com.ghatwatch.risk.GhatRisk;
import com.ghatwatch.risk.ReadingStatus;
import com.ghatwatch.risk.RiskEngine;
import com.ghatwatch.risk.Scope;
import com.ghatwatch.risk.Tier;
import com.ghatwatch.web.dto.GhatDetail;
import com.ghatwatch.web.dto.PlanRequest;
import com.ghatwatch.web.dto.PlanView;
import com.ghatwatch.web.dto.RankingResponse;
import com.ghatwatch.web.dto.ReadingView;
import com.ghatwatch.web.dto.Totals;
import com.ghatwatch.web.dto.YearRisk;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class GhatWatchService {

    public static final ZoneId BHOPAL = ZoneId.of("Asia/Kolkata");

    private final GhatRepository ghats;
    private final ReadingRepository readings;
    private final CpcbCriterionRepository criteria;
    private final ActionPlanRepository plans;
    private final FieldReadingRepository fieldReadings;
    private final LocalDate visarjanDate;

    public GhatWatchService(GhatRepository ghats, ReadingRepository readings, CpcbCriterionRepository criteria,
                            ActionPlanRepository plans, FieldReadingRepository fieldReadings,
                            @Value("${ghat-watch.visarjan-date:2026-10-20}") LocalDate visarjanDate) {
        this.ghats = ghats;
        this.readings = readings;
        this.criteria = criteria;
        this.plans = plans;
        this.fieldReadings = fieldReadings;
        this.visarjanDate = visarjanDate;
    }

    /** The report readings never change once loaded, so they are read from the database once. */
    private volatile List<Reading> reportReadingsCache;

    private List<Reading> reportReadings() {
        List<Reading> cached = reportReadingsCache;
        if (cached == null || cached.isEmpty()) {
            cached = List.copyOf(readings.findAll());
            reportReadingsCache = cached;
        }
        return cached;
    }

    /** MPPCB report readings plus readings typed in after a visarjan. */
    public List<Reading> allReadings() {
        List<Reading> all = new java.util.ArrayList<>(reportReadings());
        fieldReadings.findAll().forEach(f -> all.add(f.toReading(Units.of(f.getParameter()))));
        return all;
    }

    public BathingLimits limits() {
        return BathingLimits.from(criteria.findAll());
    }

    public List<GhatRisk> rank(Scope scope) {
        return new RiskEngine(limits()).rank(ghats.findAll(), allReadings(), scope);
    }

    public RankingResponse ranking(Scope scope) {
        List<GhatRisk> ranked = rank(scope);
        LocalDate today = LocalDate.now(BHOPAL);
        return new RankingResponse(scope, today, visarjanDate, ChronoUnit.DAYS.between(today, visarjanDate),
                totals(ranked), ranked);
    }

    public LocalDate visarjanDate() {
        return visarjanDate;
    }

    public static Totals totals(List<GhatRisk> ranked) {
        int expected = ranked.stream().mapToInt(g -> g.coverage().keyReadingsExpected()).sum();
        int present = ranked.stream().mapToInt(g -> g.coverage().keyReadingsPresent()).sum();
        return new Totals(ranked.size(),
                ranked.stream().mapToInt(g -> g.dissolvedOxygen().tests()).sum(),
                ranked.stream().mapToInt(g -> g.dissolvedOxygen().breaches()).sum(),
                ranked.stream().mapToInt(g -> g.bod().tests()).sum(),
                ranked.stream().mapToInt(g -> g.bod().breaches()).sum(),
                ranked.stream().mapToInt(g -> g.ph().tests()).sum(),
                ranked.stream().mapToInt(g -> g.ph().breaches()).sum(),
                expected, expected - present);
    }

    public GhatDetail detail(String ghatId, Scope scope) {
        Ghat ghat = ghats.findById(ghatId).orElseThrow(() -> new NoSuchElementException("No ghat " + ghatId));
        GhatRisk risk = rank(scope).stream().filter(g -> g.ghatId().equals(ghatId)).findFirst().orElseThrow();
        BathingLimits limits = limits();

        List<String> events = allReadings().stream()
                .map(RiskEngine::eventOf).filter(scope::includes).distinct().sorted()
                .map(EventKey::label).toList();

        List<ReadingView> rows = allReadings().stream()
                .filter(r -> r.getGhatId().equals(ghatId))
                .filter(r -> scope.includes(RiskEngine.eventOf(r)))
                .sorted(Comparator.comparing(RiskEngine::eventOf).thenComparing(Reading::getId))
                .map(r -> view(r, limits))
                .toList();

        return new GhatDetail(risk, ghat.getNote(), ghat.getNoteHi(), events, rows, plan(ghatId));
    }

    private static ReadingView view(Reading r, BathingLimits limits) {
        ReadingStatus status = limits.status(r);
        return new ReadingView(r.getId(), r.getGhatId(), r.getYear(), r.getFestival(), r.getPhase(), r.getParameter(),
                r.getValue(), r.getValueAsPrinted(), r.getUnitAssumed(), r.getFlag(), status,
                limits.limitText(r.getParameter()), r.getSourcePage(),
                r.isFieldEntry() ? null : ReportCatalog.pdfUrl(r.getYear(), r.getSourcePage()),
                r.getParameterAsPrinted(), r.getSiteAsPrinted(), r.isFieldEntry(), r.getSourceNote());
    }

    /** Every reading in scope, for the analytics and evidence explorer screens. */
    public List<ReadingView> readings(Scope scope) {
        BathingLimits limits = limits();
        return allReadings().stream()
                .filter(r -> scope.includes(RiskEngine.eventOf(r)))
                .sorted(Comparator.comparing(RiskEngine::eventOf).thenComparing(Reading::getId))
                .map(r -> view(r, limits))
                .toList();
    }

    /** The ranking recomputed for each report year on its own, so years can be compared. */
    public List<YearRisk> trend(Scope scope) {
        RiskEngine engine = new RiskEngine(limits());
        List<Ghat> allGhats = ghats.findAll();
        List<Reading> all = allReadings();
        return all.stream().map(Reading::getYear).distinct().sorted()
                .map(year -> {
                    List<GhatRisk> ranked = engine.rank(allGhats, all, e -> e.year() == year && scope.includes(e));
                    List<YearRisk.GhatScore> scores = ranked.stream()
                            .map(g -> new YearRisk.GhatScore(g.ghatId(), g.name(), g.nameHi(), g.score(), g.tier(),
                                    g.coverage().keyReadingsPresent() > 0))
                            .toList();
                    return new YearRisk(year,
                            count(scores, Tier.HIGH), count(scores, Tier.MEDIUM), count(scores, Tier.LOW),
                            (int) scores.stream().filter(s -> !s.tested()).count(), scores);
                })
                .toList();
    }

    /** Ghats with no test that year are not counted in any tier. */
    private static int count(List<YearRisk.GhatScore> scores, Tier tier) {
        return (int) scores.stream().filter(s -> s.tested() && s.tier() == tier).count();
    }

    public Map<String, PlanView> plans() {
        Map<String, ActionPlan> saved = plans.findAll().stream()
                .collect(Collectors.toMap(ActionPlan::getGhatId, Function.identity()));
        return ghats.findAll().stream().collect(Collectors.toMap(Ghat::getId,
                g -> toView(g.getId(), saved.get(g.getId()))));
    }

    public PlanView plan(String ghatId) {
        return toView(ghatId, plans.findById(ghatId).orElse(null));
    }

    @Transactional
    public PlanView savePlan(String ghatId, PlanRequest request) {
        if (!ghats.existsById(ghatId)) {
            throw new NoSuchElementException("No ghat " + ghatId);
        }
        ActionPlan plan = plans.findById(ghatId).orElseGet(() -> new ActionPlan(ghatId));
        String note = request.note() == null || request.note().isBlank() ? null : request.note().strip();
        plan.update(request.aeration(), request.cleaning(), request.extraTesting(), note);
        return toView(ghatId, plans.save(plan));
    }

    @Transactional
    public void clearPlan(String ghatId) {
        plans.deleteById(ghatId);
    }

    private static PlanView toView(String ghatId, ActionPlan plan) {
        if (plan == null) {
            return new PlanView(ghatId, false, false, false, false, null, null);
        }
        return new PlanView(ghatId, true, plan.isAeration(), plan.isCleaning(), plan.isExtraTesting(),
                plan.getNote(), plan.getUpdatedAt());
    }
}
