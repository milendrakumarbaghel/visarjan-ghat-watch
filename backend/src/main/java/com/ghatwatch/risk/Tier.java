package com.ghatwatch.risk;

/**
 * Risk tier shown to the officer. Thresholds are on the 0 to 100 risk score.
 * Tiers are relative priority: a "Lower" ghat can still breach the bathing limits.
 */
public enum Tier {
    HIGH("High", "उच्च"),
    MEDIUM("Medium", "मध्यम"),
    LOW("Lower", "अपेक्षाकृत कम");

    public static final double HIGH_FROM = 30;
    public static final double MEDIUM_FROM = 15;

    private final String label;
    private final String labelHi;

    Tier(String label, String labelHi) {
        this.label = label;
        this.labelHi = labelHi;
    }

    public static Tier of(double score) {
        if (score >= HIGH_FROM) {
            return HIGH;
        }
        return score >= MEDIUM_FROM ? MEDIUM : LOW;
    }

    public String label() {
        return label;
    }

    public String labelHi() {
        return labelHi;
    }
}
