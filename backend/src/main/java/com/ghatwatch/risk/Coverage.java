package com.ghatwatch.risk;

import java.util.List;

/**
 * How much of the expected testing exists for a ghat.
 *
 * @param keyReadingsExpected festivals in scope x 3 phases x 3 scored parameters
 * @param keyReadingsPresent  of those, readings with a number or BDL/ND
 */
public record Coverage(int eventsExpected, int eventsWithData, int keyReadingsExpected,
                       int keyReadingsPresent, int percent, List<EventGap> gaps) {

    public static Coverage of(int eventsExpected, int eventsWithData, int expected, int present,
                              List<EventGap> gaps) {
        int percent = expected == 0 ? 0 : Math.round(100f * present / expected);
        return new Coverage(eventsExpected, eventsWithData, expected, present, percent, gaps);
    }
}
