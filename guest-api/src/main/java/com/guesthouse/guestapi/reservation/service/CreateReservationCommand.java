package com.guesthouse.guestapi.reservation.service;

import java.time.LocalDate;

public record CreateReservationCommand(
        Long guestUserId,
        Long roomTypeId,
        LocalDate checkInDate,
        LocalDate checkOutDate
) {
}
