package com.guesthouse.opsapi.hostasset.model;

import java.math.BigDecimal;

public class HostRoomTypeRecord {

    private Long roomTypeId;
    private Long accommodationId;
    private String name;
    private Integer baseCapacity;
    private Integer maxCapacity;
    private BigDecimal basePrice;
    private String status;
    private Integer roomCount;
    private Integer activeRoomCount;

    public Long getRoomTypeId() {
        return roomTypeId;
    }

    public void setRoomTypeId(Long roomTypeId) {
        this.roomTypeId = roomTypeId;
    }

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

    public Integer getBaseCapacity() {
        return baseCapacity;
    }

    public void setBaseCapacity(Integer baseCapacity) {
        this.baseCapacity = baseCapacity;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
}
