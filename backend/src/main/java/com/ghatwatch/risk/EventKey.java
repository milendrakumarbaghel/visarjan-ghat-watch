package com.ghatwatch.risk;

import java.util.Comparator;

/** One festival in one year, e.g. Ganesh 2025. Ganesh comes before Durga in the same year. */
public record EventKey(int year, String festival) implements Comparable<EventKey> {

    public static final String GANESH = "Ganesh";
    public static final String DURGA = "Durga";

    private static final Comparator<EventKey> ORDER = Comparator
            .comparingInt(EventKey::year)
            .thenComparingInt(e -> GANESH.equals(e.festival()) ? 0 : 1);

    public boolean isDurga() {
        return DURGA.equals(festival);
    }

    public String label() {
        return festival + " " + year;
    }

    public String labelHi() {
        return (isDurga() ? "दुर्गा" : "गणेश") + " " + year;
    }

    @Override
    public int compareTo(EventKey other) {
        return ORDER.compare(this, other);
    }
}
