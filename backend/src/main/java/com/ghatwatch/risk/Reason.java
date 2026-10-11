package com.ghatwatch.risk;

import java.util.List;

/**
 * One plain-word reason behind a rank, in English and Hindi, with the readings that back it.
 *
 * @param kind  DISSOLVED_OXYGEN, BOD, PH, IMMERSION_EFFECT, DATA_GAP or SITE_NAME
 * @param tone  "alert" (limit breached), "ok" (limit met), "gap" (data missing) or "info"
 */
public record Reason(String kind, String tone, String en, String hi, List<ReadingRef> evidence) {
}
