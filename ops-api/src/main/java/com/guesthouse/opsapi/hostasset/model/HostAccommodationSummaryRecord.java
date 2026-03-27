package com.guesthouse.opsapi.hostasset.model;

public class HostAccommodationSummaryRecord {

    private Long accommodationId;
    private String name;
    private String region;
    private String address;
    private String status;
    private Integer roomTypeCount;
    private Integer roomCount;
    private Integer activeRoomCount;
    private Integer pendingReservationCount;

    public Long getAccommodationId() {
        return accommodationId;
    }

    public void setAccommodationId(Long accommodationId) {
        this.accommodationId = accommodationId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getRoomTypeCount() {
        return roomTypeCount;
    }

    public void setRoomTypeCount(Integer roomTypeCount) {
        this.roomTypeCount = roomTypeCount;
    }

    public Integer getRoomCount() {
        return roomCount;
    }

    public void setRoomCount(Integer roomCount) {
        this.roomCount = roomCount;
    }

    public Integer getActiveRoomCount() {
        return activeRoomCount;
    }

    public void setActiveRoomCount(Integer activeRoomCount) {
        this.activeRoomCount = activeRoomCount;
    }

    public Integer getPendingReservationCount() {
        return pendingReservationCount;
    }

    public void setPendingReservationCount(Integer pendingReservationCount) {
        this.pendingReservationCount = pendingReservationCount;
    }
}
