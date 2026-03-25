package com.guesthouse.opsapi.pricing.api;

import com.guesthouse.opsapi.pricing.service.PricePolicyMutationResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PricePolicyMutationResponse(
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
        OffsetDateTime changedAt
) {

    public static PricePolicyMutationResponse from(PricePolicyMutationResult result) {
        return new PricePolicyMutationResponse(
                result.policyId(),
                result.accommodationId(),
                result.accommodationName(),
                result.roomTypeId(),
                result.roomTypeName(),
                result.policyName(),
                result.startDate(),
                result.endDate(),
                result.deltaAmount(),
                result.dayOfWeekMask(),
                result.status(),
                result.changedAt()
        );
    }
}
