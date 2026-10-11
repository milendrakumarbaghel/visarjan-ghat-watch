package com.ghatwatch.web.dto;

import com.ghatwatch.risk.GhatRisk;

import java.util.List;

public record GhatDetail(GhatRisk risk, String note, String noteHi, List<String> events,
                         List<ReadingView> readings, PlanView plan) {
}
