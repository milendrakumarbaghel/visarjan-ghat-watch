package com.ghatwatch.web.dto;

import com.ghatwatch.risk.GhatRisk;
import com.ghatwatch.risk.Scope;

import java.time.LocalDate;
import java.util.List;

public record RankingResponse(Scope scope, LocalDate generatedOn, LocalDate visarjanDate,
                              long daysToVisarjan, Totals totals, List<GhatRisk> ghats) {
}
