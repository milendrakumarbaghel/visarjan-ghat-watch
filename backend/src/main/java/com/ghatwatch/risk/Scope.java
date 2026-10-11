package com.ghatwatch.risk;

/** Which festivals feed the ranking. */
public enum Scope {
    /** Every Ganesh and Durga test, 2023 to 2025. */
    ALL,
    /** Durga tests only: the festival being planned. */
    DURGA;

    public boolean includes(EventKey event) {
        return this == ALL || event.isDurga();
    }

    public static Scope parse(String value) {
        return value != null && value.equalsIgnoreCase("durga") ? DURGA : ALL;
    }
}
