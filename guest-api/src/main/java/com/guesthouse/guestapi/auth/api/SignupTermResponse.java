package com.guesthouse.guestapi.auth.api;

import com.guesthouse.shared.db.term.model.PublishedRequiredTermRecord;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record SignupTermResponse(
        Long termId,
        String category,
        String title,
        String content,
        String version,
        OffsetDateTime effectiveAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static SignupTermResponse from(PublishedRequiredTermRecord record) {
        return new SignupTermResponse(
                record.getTermId(),
                record.getCategory(),
                record.getTitle(),
                record.getContent(),
                record.getVersion(),
                record.getEffectiveAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
