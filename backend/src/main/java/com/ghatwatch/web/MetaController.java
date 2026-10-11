package com.ghatwatch.web;

import com.ghatwatch.domain.CpcbCriterion;
import com.ghatwatch.report.ReportCatalog;
import com.ghatwatch.repository.CpcbCriterionRepository;
import com.ghatwatch.risk.Tier;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/** Sources, CPCB limits and the scoring method, for the "How this works" page. */
@RestController
@RequestMapping("/api/meta")
public class MetaController {

    public record Method(double doWeight, double bodWeight, double phWeight, double highFrom, double mediumFrom) {
    }

    public record Meta(List<CpcbCriterion> criteria, List<ReportCatalog.Report> reports, Method method) {
    }

    private final CpcbCriterionRepository criteria;

    public MetaController(CpcbCriterionRepository criteria) {
        this.criteria = criteria;
    }

    @GetMapping
    public Meta meta() {
        List<CpcbCriterion> rows = criteria.findAll().stream()
                .sorted(Comparator.comparing(CpcbCriterion::getWaterClass).thenComparing(CpcbCriterion::getId))
                .toList();
        return new Meta(rows, ReportCatalog.REPORTS,
                new Method(0.50, 0.35, 0.15, Tier.HIGH_FROM, Tier.MEDIUM_FROM));
    }
}
