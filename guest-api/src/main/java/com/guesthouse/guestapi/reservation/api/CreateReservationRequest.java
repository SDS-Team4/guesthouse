package com.guesthouse.guestapi.reservation.api;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateReservationRequest(
        @NotNull Long roomTypeId,
        @NotNull Integer guestCount,
        @NotNull LocalDate checkInDate,
        @NotNull LocalDate checkOutDate
) {
}
