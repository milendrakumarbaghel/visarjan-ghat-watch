package com.ghatwatch.web.dto;

import com.ghatwatch.risk.ReadingStatus;

import java.math.BigDecimal;

/** One reading as shown in the evidence table, with its status against the class B limit. */
public record ReadingView(Long id, String ghatId, int year, String festival, String phase, String parameter,
                          BigDecimal value, String valueAsPrinted, String unit, String flag,
                          ReadingStatus status, String limit, int sourcePage, String pdfUrl,
                          String parameterAsPrinted, String siteAsPrinted, boolean fieldEntry,
                          String sourceNote) {
}
