package com.ghatwatch.risk;

import com.ghatwatch.domain.Reading;
import com.ghatwatch.report.ReportCatalog;

import java.math.BigDecimal;

/**
 * A pointer from a claim back to the exact cell in the MPPCB report, or, for readings typed in
 * after a visarjan, to that entry (no report page, so pdfUrl is null).
 */
public record ReadingRef(Long readingId, int year, String festival, String phase, String parameter,
                         BigDecimal value, String valueAsPrinted, String unit, int sourcePage,
                         String pdfUrl, boolean fieldEntry) {

    public static ReadingRef of(Reading r) {
        return new ReadingRef(r.getId(), r.getYear(), r.getFestival(), r.getPhase(), r.getParameter(),
                r.getValue(), r.getValueAsPrinted(), r.getUnitAssumed(), r.getSourcePage(),
                r.isFieldEntry() ? null : ReportCatalog.pdfUrl(r.getYear(), r.getSourcePage()), r.isFieldEntry());
    }

    /** "Ganesh 2025, during immersion, report p.28". */
    public String where() {
        String source = fieldEntry ? "entered in Ghat Watch" : year + " report p." + sourcePage;
        return festival + " " + year + ", " + Labels.phase(phase) + ", " + source;
    }

    public String whereHi() {
        String source = fieldEntry ? "घाट वॉच में दर्ज" : year + " रिपोर्ट पृ." + sourcePage;
        return new EventKey(year, festival).labelHi() + ", " + Labels.phaseHi(phase) + ", " + source;
    }
}
