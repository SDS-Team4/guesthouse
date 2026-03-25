package com.guesthouse.guestapi.account.api;

import com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord;
import com.guesthouse.shared.domain.user.HostRoleRequestStatus;

import java.time.OffsetDateTime;
import java.time.ZoneId;

public record GuestHostRoleRequestResponse(
        Long requestId,
        String requestReason,
        HostRoleRequestStatus status,
        Long reviewedByUserId,
        String reviewedByLoginId,
        String reviewedByName,
        String reviewReason,
        OffsetDateTime createdAt,
        OffsetDateTime reviewedAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static GuestHostRoleRequestResponse from(HostRoleRequestRecord record) {
        return new GuestHostRoleRequestResponse(
                record.getRequestId(),
                record.getRequestReason(),
                record.getStatus(),
                record.getReviewedByUserId(),
                record.getReviewedByLoginId(),
                record.getReviewedByName(),
                record.getReviewReason(),
                record.getCreatedAt() == null ? null : record.getCreatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                record.getReviewedAt() == null ? null : record.getReviewedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
