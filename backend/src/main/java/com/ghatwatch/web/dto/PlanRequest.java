package com.ghatwatch.web.dto;

import jakarta.validation.constraints.Size;

public record PlanRequest(boolean aeration, boolean cleaning, boolean extraTesting,
                          @Size(max = 1000) String note) {
}
