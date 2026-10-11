package com.ghatwatch.risk;

/**
 * An action the data points to. The officer decides; this only says why it is suggested.
 *
 * @param action AERATION, CLEANING or EXTRA_TESTING
 */
public record SuggestedAction(String action, String why, String whyHi) {

    public static final String AERATION = "AERATION";
    public static final String CLEANING = "CLEANING";
    public static final String EXTRA_TESTING = "EXTRA_TESTING";
}
