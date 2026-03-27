package com.guesthouse.opsapi.admin.service;

import java.time.OffsetDateTime;

public record AdminTermMutationResult(
        Long termId,
        String category,
        String title,
        String content,
        String version,
        boolean required,
        String status,
        OffsetDateTime effectiveAt,
        OffsetDateTime changedAt
) {
}
