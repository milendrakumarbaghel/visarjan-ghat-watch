package com.ghatwatch.report;

import java.util.List;

/** The three MPPCB visarjan reports the readings come from. Copies are served at /reports/. */
public final class ReportCatalog {

    public record Report(int year, String title, int pages, String officialUrl, String localPath) {
    }

    public static final List<Report> REPORTS = List.of(
            new Report(2023, "MPPCB Idol Immersion Report 2023 (CPCB format)", 87,
                    "https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf",
                    "/reports/mppcb-visarjan-2023.pdf"),
            new Report(2024, "MPPCB Ganesh and Durga Visarjan Report 2024", 118,
                    "https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf",
                    "/reports/mppcb-visarjan-2024.pdf"),
            new Report(2025, "MPPCB Ganesh and Durga Visarjan Report 2025", 92,
                    "https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf",
                    "/reports/mppcb-visarjan-2025.pdf"));

    private ReportCatalog() {
    }

    /** Link that opens the local copy of that year's report at the given page. */
    public static String pdfUrl(int year, int page) {
        return "/reports/mppcb-visarjan-" + year + ".pdf#page=" + page;
    }
}
