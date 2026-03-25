package com.guesthouse.shared.db.reservation.model;

import java.time.LocalDate;

public class GuestReservationNightRecord {

    private Long reservationNightId;
    private LocalDate stayDate;

    public Long getReservationNightId() {
        return reservationNightId;
    }

    public void setReservationNightId(Long reservationNightId) {
        this.reservationNightId = reservationNightId;
    }

    public LocalDate getStayDate() {
        return stayDate;
    }

    public void setStayDate(LocalDate stayDate) {
        this.stayDate = stayDate;
    }
}
