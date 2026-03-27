package com.guesthouse.opsapi.admin.api;

import com.guesthouse.shared.db.term.model.AdminTermDetailRecord;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record AdminTermDetailResponse(
        Long termId,
        String category,
        String title,
        String content,
        String version,
        boolean required,
        String status,
        OffsetDateTime effectiveAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static AdminTermDetailResponse from(AdminTermDetailRecord record) {
        return new AdminTermDetailResponse(
                record.getTermId(),
                record.getCategory(),
                record.getTitle(),
                record.getContent(),
                record.getVersion(),
                record.isRequired(),
                record.getStatus(),
                record.getEffectiveAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getCreatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getUpdatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
