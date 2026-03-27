package com.guesthouse.opsapi.admin.api;

import com.guesthouse.opsapi.admin.service.AdminTermMutationResult;

public record AdminTermMutationResponse(
        Long termId,
        String category,
        String version,
        boolean required,
        String status,
        String title,
        String content,
        String effectiveAt,
        String changedAt
) {
    public static AdminTermMutationResponse from(AdminTermMutationResult result) {
        return new AdminTermMutationResponse(
                result.termId(),
                result.category(),
                result.version(),
                result.required(),
                result.status(),
                result.title(),
                result.content(),
                result.effectiveAt().toString(),
                result.changedAt().toString()
        );
    }
}
