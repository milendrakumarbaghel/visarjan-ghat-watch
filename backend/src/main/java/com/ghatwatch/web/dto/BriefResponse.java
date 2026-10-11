package com.ghatwatch.web.dto;

import com.ghatwatch.risk.Scope;

import java.time.LocalDate;

public record BriefResponse(Scope scope, LocalDate generatedOn, String english, String hindi) {
}
