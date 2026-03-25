package com.guesthouse.shared.db.reservation.model;

import java.time.LocalDate;

public class OccupiedRoomNightRecord {

    private Long roomId;
    private LocalDate stayDate;

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
