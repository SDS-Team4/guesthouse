package com.guesthouse.opsapi.reservation.api;

import com.guesthouse.opsapi.reservation.service.ReservationNightSwapResult;

import java.time.OffsetDateTime;

public record ReservationNightSwapResponse(
        Long sourceReservationId,
        String sourceReservationNo,
        Long targetReservationId,
        String targetReservationNo,
        String stayDate,
        OffsetDateTime changedAt
) {

    public static ReservationNightSwapResponse from(ReservationNightSwapResult result) {
        return new ReservationNightSwapResponse(
                result.sourceReservationId(),
                result.sourceReservationNo(),
                result.targetReservationId(),
                result.targetReservationNo(),
                result.stayDate().toString(),
                result.changedAt()
        );
    }
}
