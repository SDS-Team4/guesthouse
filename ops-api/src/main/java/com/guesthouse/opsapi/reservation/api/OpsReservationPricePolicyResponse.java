package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OpsReservationPricePolicyResponse(
        Long policyId,
        Long roomTypeId,
        String roomTypeName,
        String policyName,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal deltaAmount,
        Integer dayOfWeekMask
) {

    public static OpsReservationPricePolicyResponse from(ActivePricePolicyRecord record) {
        return new OpsReservationPricePolicyResponse(
                record.getPolicyId(),
                record.getRoomTypeId(),
                record.getRoomTypeName(),
                record.getPolicyName(),
                record.getStartDate(),
                record.getEndDate(),
                record.getDeltaAmount(),
                record.getDayOfWeekMask()
        );
    }
}
