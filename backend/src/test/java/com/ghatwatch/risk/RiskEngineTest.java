package com.ghatwatch.risk;

import com.ghatwatch.domain.Ghat;
import com.ghatwatch.domain.Reading;
import com.ghatwatch.seed.GhatCatalog;
import com.ghatwatch.service.GhatWatchService;
import com.ghatwatch.web.dto.Totals;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Runs the engine on the real data pack, without a database. */
class RiskEngineTest {

    private static final BathingLimits LIMITS = BathingLimits.defaults();
    private static List<Reading> readings;

    @BeforeAll
    static void load() throws Exception {
        Map<String, String> idByName = GhatCatalog.GHATS.stream()
                .collect(Collectors.toMap(Ghat::getName, Ghat::getId));
        CSVFormat format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get();
        try (Reader in = new InputStreamReader(Objects.requireNonNull(
                RiskEngineTest.class.getResourceAsStream("/data/bhopal_ghats_2023_2025.csv")), StandardCharsets.UTF_8)) {
            readings = new ArrayList<>();
            for (CSVRecord r : format.parse(in)) {
                String value = r.get("value");
                readings.add(new Reading(idByName.get(r.get("site")), Integer.parseInt(r.get("year")),
                        r.get("festival"), r.get("phase"), r.get("parameter"),
                        value.isBlank() ? null : new BigDecimal(value), r.get("unit_assumed"),
                        r.get("flag").isBlank() ? null : r.get("flag"), r.get("value_as_printed"),
                        r.get("parameter_as_printed"), r.get("site_as_printed"),
                        r.get("site_match_confidence"), Integer.parseInt(r.get("source_page"))));
            }
        }
    }

    private static List<GhatRisk> rank(Scope scope) {
        return new RiskEngine(LIMITS).rank(GhatCatalog.GHATS, readings, scope);
    }

    private static GhatRisk ghat(List<GhatRisk> ranked, String id) {
        return ranked.stream().filter(g -> g.ghatId().equals(id)).findFirst().orElseThrow();
    }

    @Test
    void totalsMatchTheParticipantGuide() {
        Totals t = GhatWatchService.totals(rank(Scope.ALL));
        assertEquals(1524, readings.size());
        assertEquals(116, t.doTests());
        assertEquals(42, t.doBreaches());
        assertEquals(112, t.bodTests());
        assertEquals(100, t.bodBreaches());
    }

    @Test
    void bairagarhOxygenReadZeroFourTimes() {
        GhatRisk bairagarh = ghat(rank(Scope.ALL), "bairagarh");
        assertEquals(4, bairagarh.dissolvedOxygen().zeroReadings());
        assertEquals(0, bairagarh.dissolvedOxygen().worst().value().signum());
    }

    @Test
    void missingDurga2025IsAGapNotClean() {
        GhatRisk malikhedi = ghat(rank(Scope.ALL), "malikhedi");
        EventGap durga2025 = malikhedi.coverage().gaps().stream()
                .filter(g -> g.year() == 2025 && g.festival().equals("Durga"))
                .findFirst().orElseThrow();
        assertTrue(durga2025.noTable());
        assertTrue(malikhedi.coverage().percent() < 100);
        assertTrue(malikhedi.suggestedActions().stream()
                .anyMatch(a -> a.action().equals(SuggestedAction.EXTRA_TESTING)));
    }

    @Test
    void notSampledReadingsAreNotCountedAsTests() {
        // Bairagarh Ganesh 2025 was sampled only during immersion.
        GhatRisk bairagarh = ghat(rank(Scope.ALL), "bairagarh");
        assertEquals(13, bairagarh.dissolvedOxygen().tests());
        assertEquals(2, bairagarh.dissolvedOxygen().missing());
    }

    @Test
    void bdlIsLowButNotMissing() {
        Reading bdl = readings.stream().filter(r -> "BDL".equals(r.getFlag())).findFirst().orElseThrow();
        assertFalse(bdl.isMissing());
        assertEquals(ReadingStatus.BELOW_DETECTION, LIMITS.status(bdl));
    }

    @Test
    void severityFollowsTheLimits() {
        assertEquals(1.0, LIMITS.severity(reading("Dissolved oxygen", "0")));
        assertEquals(0.0, LIMITS.severity(reading("Dissolved oxygen", "5")));
        assertEquals(0.5, LIMITS.severity(reading("Dissolved oxygen", "2.5")));
        assertEquals(0.0, LIMITS.severity(reading("BOD", "3")));
        assertEquals(1.0, LIMITS.severity(reading("BOD", "12")));
        assertEquals(0.5, LIMITS.severity(reading("pH", "9.0")));
        assertEquals(0.0, LIMITS.severity(reading("Lead", "0.9")));
    }

    @Test
    void uncertainSiteNameIsFlagged() {
        GhatRisk rani = ghat(rank(Scope.ALL), "rani-kamlapati");
        assertTrue(rani.reasons().stream().anyMatch(r -> r.kind().equals("SITE_NAME")));
    }

    @Test
    void everyBreachReasonIsTraceableToAPage() {
        for (GhatRisk g : rank(Scope.ALL)) {
            for (Reason r : g.reasons()) {
                if (r.tone().equals("alert")) {
                    assertFalse(r.evidence().isEmpty(), g.name() + ": " + r.en());
                    r.evidence().forEach(e -> assertTrue(e.sourcePage() > 0 && e.pdfUrl().contains("#page=")));
                }
            }
        }
    }

    @Test
    void printRanking() {
        for (Scope scope : Scope.values()) {
            System.out.println("== " + scope);
            for (GhatRisk g : rank(scope)) {
                System.out.printf("%d. %-40s %5.1f %-6s cov=%d%% actions=%s%n", g.rank(), g.name(), g.score(),
                        g.tier(), g.coverage().percent(),
                        g.suggestedActions().stream().map(SuggestedAction::action).toList());
                g.reasons().forEach(r -> System.out.println("     [" + r.tone() + "] " + r.en()));
            }
        }
    }

    private static Reading reading(String parameter, String value) {
        return new Reading("x", 2025, "Durga", "during", parameter, new BigDecimal(value), null, null,
                value, parameter, "x", "high", 1);
    }
}
