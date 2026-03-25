package com.guesthouse.opsapi.pricing.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PricePolicyMutationResult(
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
}
