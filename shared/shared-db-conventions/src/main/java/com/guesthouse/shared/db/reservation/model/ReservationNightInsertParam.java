package com.guesthouse.shared.db.reservation.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ReservationNightInsertParam {

    private Long reservationId;
    private LocalDate stayDate;
    private Long assignedRoomId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public LocalDate getStayDate() {
        return stayDate;
    }

    public void setStayDate(LocalDate stayDate) {
        this.stayDate = stayDate;
    }

    public Long getAssignedRoomId() {
        return assignedRoomId;
    }

    public void setAssignedRoomId(Long assignedRoomId) {
        this.assignedRoomId = assignedRoomId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
