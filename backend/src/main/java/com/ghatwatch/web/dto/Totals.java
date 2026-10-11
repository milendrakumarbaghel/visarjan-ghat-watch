package com.ghatwatch.web.dto;

/** Headline counts across all ghats for the chosen scope. */
public record Totals(int ghats, int doTests, int doBreaches, int bodTests, int bodBreaches,
                     int phTests, int phBreaches, int keyReadingsExpected, int keyReadingsMissing) {
}
