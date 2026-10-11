package com.ghatwatch.risk;

import java.util.List;

/**
 * Key readings (dissolved oxygen, BOD, pH) missing for one festival at one ghat.
 *
 * @param noTable true when the report has no table at all for this ghat and festival
 */
public record EventGap(int year, String festival, boolean noTable, List<String> missing,
                       String en, String hi) {
}
