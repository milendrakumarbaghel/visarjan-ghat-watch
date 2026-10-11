package com.ghatwatch.service;

import java.util.List;

/** The 13 parameters MPPCB tests, and the standard unit assumed for each (the reports print none). */
public final class Units {

    public static final List<String> PARAMETERS = List.of("pH", "Total solids", "Dissolved solids", "Suspended solids",
            "Dissolved oxygen", "BOD", "COD", "Turbidity", "Conductivity", "Chromium", "Lead", "Zinc", "Copper");

    private Units() {
    }

    public static String of(String parameter) {
        return switch (parameter) {
            case "pH" -> null;
            case "Turbidity" -> "NTU";
            case "Conductivity" -> "µS/cm";
            default -> "mg/l";
        };
    }
}
