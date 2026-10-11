package com.ghatwatch.risk;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Plain-word labels in English and Hindi, and number formatting. */
public final class Labels {

    public static final List<String> PHASES = List.of("pre", "during", "after");

    private static final Map<String, String> PHASE_EN = Map.of(
            "pre", "before immersion",
            "during", "during immersion",
            "after", "one week after");

    private static final Map<String, String> PHASE_HI = Map.of(
            "pre", "विसर्जन से पहले",
            "during", "विसर्जन के दौरान",
            "after", "एक सप्ताह बाद");

    private static final Map<String, String> PARAMETER_HI = Map.ofEntries(
            Map.entry("pH", "पीएच"),
            Map.entry("Dissolved oxygen", "घुलित ऑक्सीजन"),
            Map.entry("BOD", "बीओडी"),
            Map.entry("COD", "सीओडी"),
            Map.entry("Total solids", "कुल ठोस"),
            Map.entry("Dissolved solids", "घुलित ठोस"),
            Map.entry("Suspended solids", "निलंबित ठोस"),
            Map.entry("Turbidity", "गंदलापन"),
            Map.entry("Conductivity", "चालकता"),
            Map.entry("Chromium", "क्रोमियम"),
            Map.entry("Lead", "सीसा"),
            Map.entry("Zinc", "जस्ता"),
            Map.entry("Copper", "तांबा"));

    private Labels() {
    }

    public static String phase(String phase) {
        return PHASE_EN.getOrDefault(phase, phase);
    }

    public static String phaseHi(String phase) {
        return PHASE_HI.getOrDefault(phase, phase);
    }

    public static String parameterHi(String parameter) {
        return PARAMETER_HI.getOrDefault(parameter, parameter);
    }

    /** 4.50 becomes "4.5", 0.000 becomes "0". */
    public static String num(BigDecimal value) {
        if (value == null) {
            return "";
        }
        if (value.signum() == 0) {
            return "0";
        }
        return value.stripTrailingZeros().toPlainString();
    }

    public static String num(double value) {
        return num(BigDecimal.valueOf(value).setScale(1, java.math.RoundingMode.HALF_UP));
    }
}
