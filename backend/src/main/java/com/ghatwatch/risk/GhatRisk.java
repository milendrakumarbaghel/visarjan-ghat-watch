package com.ghatwatch.risk;

import java.util.List;

/** Everything the officer sees for one ghat in the ranked list. */
public record GhatRisk(int rank, String ghatId, String name, String nameHi, String waterBody,
                       String waterBodyHi, String siteMatchConfidence, double score, Tier tier,
                       String tierLabel, String tierLabelHi, ParameterSummary dissolvedOxygen,
                       ParameterSummary bod, ParameterSummary ph, List<Reason> reasons,
                       List<SuggestedAction> suggestedActions, Coverage coverage) {

    public GhatRisk withRank(int newRank) {
        return new GhatRisk(newRank, ghatId, name, nameHi, waterBody, waterBodyHi, siteMatchConfidence,
                score, tier, tierLabel, tierLabelHi, dissolvedOxygen, bod, ph, reasons,
                suggestedActions, coverage);
    }
}
