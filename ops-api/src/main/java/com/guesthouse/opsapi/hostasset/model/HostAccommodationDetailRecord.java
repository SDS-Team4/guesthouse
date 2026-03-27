package com.guesthouse.opsapi.hostasset.model;

import java.time.LocalTime;

public class HostAccommodationDetailRecord {

    private Long accommodationId;
    private String name;
    private String region;
    private String address;
    private String infoText;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String status;
    private Integer roomTypeCount;
    private Integer roomCount;
    private Integer activeRoomCount;
    private Integer pendingReservationCount;
    private Integer activeBlockCount;
    private Integer activePricePolicyCount;

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

    public String getInfoText() {
        return infoText;
    }

    public void setInfoText(String infoText) {
        this.infoText = infoText;
    }

    public LocalTime getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(LocalTime checkInTime) {
        this.checkInTime = checkInTime;
    }

    public LocalTime getCheckOutTime() {
        return checkOutTime;
    }

    public void setCheckOutTime(LocalTime checkOutTime) {
        this.checkOutTime = checkOutTime;
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

    public Integer getActiveBlockCount() {
        return activeBlockCount;
    }

    public void setActiveBlockCount(Integer activeBlockCount) {
        this.activeBlockCount = activeBlockCount;
    }

    public Integer getActivePricePolicyCount() {
        return activePricePolicyCount;
    }

    public void setActivePricePolicyCount(Integer activePricePolicyCount) {
        this.activePricePolicyCount = activePricePolicyCount;
    }
}
