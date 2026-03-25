package com.guesthouse.shared.db.reservation.model;

import java.time.LocalDate;

public class AccommodationOccupiedRoomNightRecord {

    private Long accommodationId;
    private Long roomId;
    private LocalDate stayDate;

    public Long getAccommodationId() {
        return accommodationId;
    }

    public void setAccommodationId(Long accommodationId) {
        this.accommodationId = accommodationId;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public LocalDate getStayDate() {
        return stayDate;
    }

    public void setStayDate(LocalDate stayDate) {
        this.stayDate = stayDate;
    }
}
