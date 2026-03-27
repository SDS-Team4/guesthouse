package com.guesthouse.opsapi.admin.api;

import com.guesthouse.shared.db.term.model.AdminTermListRecord;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record AdminTermSummaryResponse(
        Long termId,
        String category,
        String title,
        String version,
        boolean required,
        String status,
        OffsetDateTime effectiveAt,
        OffsetDateTime updatedAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static AdminTermSummaryResponse from(AdminTermListRecord record) {
        return new AdminTermSummaryResponse(
                record.getTermId(),
                record.getCategory(),
                record.getTitle(),
                record.getVersion(),
                record.isRequired(),
                record.getStatus(),
                record.getEffectiveAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getUpdatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
