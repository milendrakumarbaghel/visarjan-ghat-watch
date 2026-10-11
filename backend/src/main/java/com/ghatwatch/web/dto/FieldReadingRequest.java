package com.ghatwatch.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * One ghat's readings for one festival stage.
 *
 * @param values parameter name to the value as written on the lab sheet ("6.2", "BDL"); blanks are skipped
 */
public record FieldReadingRequest(@NotBlank String ghatId, @Min(2023) @Max(2035) int year, @NotBlank String festival,
                                  @NotBlank String phase, @Size(max = 300) String sourceNote,
                                  @NotNull Map<String, String> values) {
}
