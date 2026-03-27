package com.guesthouse.opsapi.hostasset.model;

public class HostRoomTargetRecord {

    private Long roomId;
    private Long accommodationId;
    private Long hostUserId;
    private Long roomTypeId;
    private String roomCode;
    private String status;
    private String memo;
    private String accommodationStatus;
    private String roomTypeStatus;

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

    public Long getHostUserId() {
        return hostUserId;
    }

    public void setHostUserId(Long hostUserId) {
        this.hostUserId = hostUserId;
    }

    public Long getRoomTypeId() {
        return roomTypeId;
    }

    public void setRoomTypeId(Long roomTypeId) {
        this.roomTypeId = roomTypeId;
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

    public String getAccommodationStatus() {
        return accommodationStatus;
    }

    public void setAccommodationStatus(String accommodationStatus) {
        this.accommodationStatus = accommodationStatus;
    }

    public String getRoomTypeStatus() {
        return roomTypeStatus;
    }

    public void setRoomTypeStatus(String roomTypeStatus) {
        this.roomTypeStatus = roomTypeStatus;
    }
}
