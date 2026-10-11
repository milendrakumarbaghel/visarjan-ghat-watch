package com.ghatwatch.web.dto;

import com.ghatwatch.risk.Tier;

import java.util.List;

/**
 * Risk tiers for one report year, scored on that year's readings only.
 *
 * @param untested ghats with no key reading that year; they sit in no tier
 */
public record YearRisk(int year, int high, int medium, int lower, int untested, List<GhatScore> ghats) {

    public record GhatScore(String ghatId, String name, String nameHi, double score, Tier tier, boolean tested) {
    }
}
