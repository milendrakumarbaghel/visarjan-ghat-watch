package com.ghatwatch.web.dto;

import java.time.LocalDateTime;

/** The officer's decision for one ghat. {@code saved} is false until the officer saves it. */
public record PlanView(String ghatId, boolean saved, boolean aeration, boolean cleaning,
                       boolean extraTesting, String note, LocalDateTime updatedAt) {
}
