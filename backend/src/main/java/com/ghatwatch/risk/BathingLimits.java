package com.ghatwatch.risk;

import com.ghatwatch.domain.CpcbCriterion;
import com.ghatwatch.domain.Reading;

import java.util.List;

/**
 * CPCB class B ("outdoor bathing, organised") limits for the parameters the visarjan
 * reports actually test. Class B fits ghats because people stand and bathe in the water
 * during immersion. Total coliform is part of class B but is not tested in these reports.
 *
 * <p>Conductivity is not part of class B; the class E cap is kept only as a reference.
 */
public record BathingLimits(double doMin, double bodMax, double phMin, double phMax,
                            double conductivityClassEMax) {

    public static final String DO = "Dissolved oxygen";
    public static final String BOD = "BOD";
    public static final String PH = "pH";
    public static final String CONDUCTIVITY = "Conductivity";

    /** The three parameters with a class B limit. Only these move the risk score. */
    public static final List<String> SCORED = List.of(DO, BOD, PH);

    /** Defaults equal to data/cpcb_water_quality_criteria.csv, used in tests. */
    public static BathingLimits defaults() {
        return new BathingLimits(5, 3, 6.5, 8.5, 2250);
    }

    public static BathingLimits from(List<CpcbCriterion> criteria) {
        double doMin = find(criteria, "B", "Dissolved oxygen");
        double bodMax = find(criteria, "B", "BOD");
        double[] ph = range(criteria, "B", "pH");
        double conductivity = find(criteria, "E", "Electrical conductivity");
        return new BathingLimits(doMin, bodMax, ph[0], ph[1], conductivity);
    }

    private static CpcbCriterion criterion(List<CpcbCriterion> criteria, String waterClass, String prefix) {
        return criteria.stream()
                .filter(c -> c.getWaterClass().equals(waterClass) && c.getParameter().startsWith(prefix))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "CPCB class " + waterClass + " limit for " + prefix + " is missing"));
    }

    private static double find(List<CpcbCriterion> criteria, String waterClass, String prefix) {
        return Double.parseDouble(criterion(criteria, waterClass, prefix).getLimitText());
    }

    private static double[] range(List<CpcbCriterion> criteria, String waterClass, String prefix) {
        String[] parts = criterion(criteria, waterClass, prefix).getLimitText().split("-");
        return new double[]{Double.parseDouble(parts[0]), Double.parseDouble(parts[1])};
    }

    public ReadingStatus status(Reading reading) {
        if (reading.isBelowDetection()) {
            return ReadingStatus.BELOW_DETECTION;
        }
        if (reading.isMissing()) {
            return ReadingStatus.MISSING;
        }
        double v = reading.getValue().doubleValue();
        return switch (reading.getParameter()) {
            case DO -> v < doMin ? ReadingStatus.BREACH : ReadingStatus.WITHIN;
            case BOD -> v > bodMax ? ReadingStatus.BREACH : ReadingStatus.WITHIN;
            case PH -> v < phMin || v > phMax ? ReadingStatus.BREACH : ReadingStatus.WITHIN;
            default -> ReadingStatus.NO_LIMIT;
        };
    }

    /**
     * How bad one reading is, from 0 (meets the limit) to 1 (as bad as we count).
     * <ul>
     *   <li>Dissolved oxygen: 0 at 5 mg/l or more, 1 at 0 mg/l, straight line between.</li>
     *   <li>BOD: 0 at 3 mg/l or less, 1 at 12 mg/l (four times the limit) or more.</li>
     *   <li>pH: 0 inside 6.5 to 8.5, 1 when a full pH unit outside.</li>
     * </ul>
     * BDL and missing readings return 0 here; missing data is reported separately as a gap.
     */
    public double severity(Reading reading) {
        if (reading.getValue() == null) {
            return 0;
        }
        double v = reading.getValue().doubleValue();
        double s = switch (reading.getParameter()) {
            case DO -> (doMin - v) / doMin;
            case BOD -> (v - bodMax) / (bodMax * 3);
            case PH -> v < phMin ? phMin - v : v - phMax;
            default -> 0;
        };
        return Math.clamp(s, 0.0, 1.0);
    }

    /** "5 mg/l or more", "3 mg/l or less", "6.5 to 8.5". */
    public String limitText(String parameter) {
        return switch (parameter) {
            case DO -> Labels.num(doMin) + " mg/l or more";
            case BOD -> Labels.num(bodMax) + " mg/l or less";
            case PH -> Labels.num(phMin) + " to " + Labels.num(phMax);
            default -> "none set";
        };
    }

    public String limitTextHi(String parameter) {
        return switch (parameter) {
            case DO -> Labels.num(doMin) + " mg/l या अधिक";
            case BOD -> Labels.num(bodMax) + " mg/l या कम";
            case PH -> Labels.num(phMin) + " से " + Labels.num(phMax);
            default -> "कोई सीमा तय नहीं";
        };
    }
}
