package com.ghatwatch.risk;

/** How one reading compares with the limit used for ranking. */
public enum ReadingStatus {
    /** Outside the CPCB class B (bathing) limit. */
    BREACH,
    /** Inside the CPCB class B limit. */
    WITHIN,
    /** BDL or ND: tested and very low. Not zero, not missing. */
    BELOW_DETECTION,
    /** Not sampled (blank, "_", "-", "*", "**"). Unknown, never clean. */
    MISSING,
    /** A number, but CPCB class B sets no limit for this parameter. */
    NO_LIMIT
}
