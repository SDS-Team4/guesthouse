package com.guesthouse.guestapi.reservation.service;

import java.time.LocalDate;

public record CreateReservationCommand(
        Long guestUserId,
        Long roomTypeId,
        int guestCount,
        LocalDate checkInDate,
        LocalDate checkOutDate
) {
}
