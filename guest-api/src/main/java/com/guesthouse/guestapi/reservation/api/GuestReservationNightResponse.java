package com.guesthouse.guestapi.reservation.api;

import com.guesthouse.shared.db.reservation.model.GuestReservationNightRecord;

import java.time.LocalDate;

public record GuestReservationNightResponse(
        Long reservationNightId,
        LocalDate stayDate
) {

    public static GuestReservationNightResponse from(GuestReservationNightRecord record) {
        return new GuestReservationNightResponse(
                record.getReservationNightId(),
                record.getStayDate()
        );
    }
}
