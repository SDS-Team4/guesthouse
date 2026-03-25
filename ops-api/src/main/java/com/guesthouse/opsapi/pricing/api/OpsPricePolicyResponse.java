package com.guesthouse.opsapi.pricing.api;

import com.guesthouse.shared.db.pricing.model.OpsPricePolicyRecord;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public record OpsPricePolicyResponse(
        Long policyId,
        Long accommodationId,
        String accommodationName,
        Long roomTypeId,
        String roomTypeName,
        String policyName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal deltaAmount,
        Integer dayOfWeekMask,
        String status,
        OffsetDateTime createdAt
) {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    public static OpsPricePolicyResponse from(OpsPricePolicyRecord record) {
        return new OpsPricePolicyResponse(
                record.getPolicyId(),
                record.getAccommodationId(),
                record.getAccommodationName(),
                record.getRoomTypeId(),
                record.getRoomTypeName(),
                record.getPolicyName(),
                record.getStartDate(),
                record.getEndDate(),
                record.getDeltaAmount(),
                record.getDayOfWeekMask(),
                record.getStatus(),
                record.getCreatedAt() == null ? null : record.getCreatedAt().atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }
}
