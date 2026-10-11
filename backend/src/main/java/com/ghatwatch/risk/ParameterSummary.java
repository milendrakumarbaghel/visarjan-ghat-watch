package com.ghatwatch.risk;

/**
 * One scored parameter at one ghat.
 *
 * @param tests          readings with a number or BDL/ND
 * @param breaches       readings outside the class B limit
 * @param missing        readings not sampled
 * @param zeroReadings   readings of exactly 0 (only meaningful for dissolved oxygen)
 * @param meanSeverity   average severity over tested readings, 0 to 1
 * @param worst          the reading furthest from the limit, or null if none tested
 */
public record ParameterSummary(String parameter, String limit, int tests, int breaches, int missing,
                               int zeroReadings, double meanSeverity, ReadingRef worst) {
}
