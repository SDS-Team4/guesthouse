package com.guesthouse.opsapi.hostasset.model;

public class HostRoomRecord {

    private Long roomId;
    private Long accommodationId;
    private Long roomTypeId;
    private String roomTypeName;
    private String roomCode;
    private String status;
    private String memo;
    private boolean hasFutureAssignments;

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getAccommodationId() {
        return accommodationId;
    }

    public void setAccommodationId(Long accommodationId) {
        this.accommodationId = accommodationId;
    }

    public Long getRoomTypeId() {
        return roomTypeId;
    }

    public void setRoomTypeId(Long roomTypeId) {
        this.roomTypeId = roomTypeId;
    }

    public String getRoomTypeName() {
        return roomTypeName;
    }

    public void setRoomTypeName(String roomTypeName) {
        this.roomTypeName = roomTypeName;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMemo() {
        return memo;
    }

    public void setMemo(String memo) {
        this.memo = memo;
    }

    public boolean isHasFutureAssignments() {
        return hasFutureAssignments;
    }

    public void setHasFutureAssignments(boolean hasFutureAssignments) {
        this.hasFutureAssignments = hasFutureAssignments;
    }
}
