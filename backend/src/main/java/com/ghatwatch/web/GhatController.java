package com.ghatwatch.web;

import com.ghatwatch.risk.GhatRisk;
import com.ghatwatch.risk.ParameterSummary;
import com.ghatwatch.risk.Reason;
import com.ghatwatch.risk.Scope;
import com.ghatwatch.risk.SuggestedAction;
import com.ghatwatch.service.BriefService;
import com.ghatwatch.service.GhatWatchService;
import com.ghatwatch.web.dto.BriefResponse;
import com.ghatwatch.web.dto.GhatDetail;
import com.ghatwatch.web.dto.RankingResponse;
import com.ghatwatch.web.dto.ReadingView;
import com.ghatwatch.web.dto.YearRisk;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class GhatController {

    private final GhatWatchService ghatWatch;
    private final BriefService briefs;

    public GhatController(GhatWatchService ghatWatch, BriefService briefs) {
        this.ghatWatch = ghatWatch;
        this.briefs = briefs;
    }

    /** The ranked list of ghats. scope = all (default) or durga. */
    @GetMapping("/ranking")
    public RankingResponse ranking(@RequestParam(defaultValue = "all") String scope) {
        return ghatWatch.ranking(Scope.parse(scope));
    }

    /** The ranking as a spreadsheet, with the reasons and page numbers behind each rank. */
    @GetMapping(value = "/ranking.csv", produces = "text/csv")
    public ResponseEntity<byte[]> rankingCsv(@RequestParam(defaultValue = "all") String scope) {
        Scope parsed = Scope.parse(scope);
        StringBuilder csv = new StringBuilder(
                "rank,ghat,water_body,tier,score,do_tests,do_below_limit,do_lowest,bod_tests,bod_above_limit,"
                        + "bod_highest,ph_tests,ph_outside_range,key_readings_missing,reasons,suggested_actions\n");
        for (GhatRisk g : ghatWatch.rank(parsed)) {
            csv.append(g.rank()).append(',')
                    .append(quote(g.name())).append(',')
                    .append(quote(g.waterBody())).append(',')
                    .append(g.tierLabel()).append(',')
                    .append(g.score()).append(',')
                    .append(counts(g.dissolvedOxygen())).append(',')
                    .append(counts(g.bod())).append(',')
                    .append(g.ph().tests()).append(',').append(g.ph().breaches()).append(',')
                    .append(g.coverage().keyReadingsExpected() - g.coverage().keyReadingsPresent()).append(',')
                    .append(quote(g.reasons().stream().map(Reason::en).collect(Collectors.joining(" | ")))).append(',')
                    .append(quote(g.suggestedActions().stream().map(SuggestedAction::action)
                            .collect(Collectors.joining(" | "))))
                    .append('\n');
        }
        // A byte-order mark so Excel opens the file as UTF-8.
        byte[] body = ("﻿" + csv).getBytes(StandardCharsets.UTF_8);
        String filename = "ghat-risk-ranking-" + parsed.name().toLowerCase() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(body);
    }

    @GetMapping("/ghats/{ghatId}")
    public GhatDetail ghat(@PathVariable String ghatId, @RequestParam(defaultValue = "all") String scope) {
        return ghatWatch.detail(ghatId, Scope.parse(scope));
    }

    /** Every reading with its status against the class B limit and its source page. */
    @GetMapping("/readings")
    public List<ReadingView> readings(@RequestParam(defaultValue = "all") String scope) {
        return ghatWatch.readings(Scope.parse(scope));
    }

    /** Ghats per risk tier, with each report year scored on its own. */
    @GetMapping("/trend")
    public List<YearRisk> trend(@RequestParam(defaultValue = "all") String scope) {
        return ghatWatch.trend(Scope.parse(scope));
    }

    /** The forwardable brief, in English and Hindi. */
    @GetMapping("/brief")
    public BriefResponse brief(@RequestParam(defaultValue = "all") String scope) {
        return briefs.brief(Scope.parse(scope));
    }

    private static String counts(ParameterSummary p) {
        String worst = p.worst() == null ? "" : p.worst().value().stripTrailingZeros().toPlainString();
        return p.tests() + "," + p.breaches() + "," + worst;
    }

    private static String quote(String s) {
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}
