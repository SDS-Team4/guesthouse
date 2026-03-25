package com.guesthouse.shared.db.reservation.model;

import java.time.LocalDate;

public class OpsReservationNightRecord {

    private Long reservationNightId;
    private Long reservationId;
    private LocalDate stayDate;
    private Long assignedRoomId;
    private String assignedRoomCode;
    private Long assignedRoomTypeId;
    private String assignedRoomTypeName;

    public Long getReservationNightId() {
        return reservationNightId;
    }

    public void setReservationNightId(Long reservationNightId) {
        this.reservationNightId = reservationNightId;
    }

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

    public String getAssignedRoomCode() {
        return assignedRoomCode;
    }

    public void setAssignedRoomCode(String assignedRoomCode) {
        this.assignedRoomCode = assignedRoomCode;
    }

    public Long getAssignedRoomTypeId() {
        return assignedRoomTypeId;
    }

    public void setAssignedRoomTypeId(Long assignedRoomTypeId) {
        this.assignedRoomTypeId = assignedRoomTypeId;
    }

    public String getAssignedRoomTypeName() {
        return assignedRoomTypeName;
    }

    public void setAssignedRoomTypeName(String assignedRoomTypeName) {
        this.assignedRoomTypeName = assignedRoomTypeName;
    }
}
