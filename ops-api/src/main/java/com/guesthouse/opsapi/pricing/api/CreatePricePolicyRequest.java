package com.guesthouse.opsapi.pricing.api;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePricePolicyRequest(
        Long roomTypeId,
        String policyName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal deltaAmount,
        Integer dayOfWeekMask
) {
}
