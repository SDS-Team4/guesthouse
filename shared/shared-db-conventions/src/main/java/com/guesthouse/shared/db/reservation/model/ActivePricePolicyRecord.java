package com.guesthouse.shared.db.reservation.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ActivePricePolicyRecord {

    private Long policyId;
    private Long roomTypeId;
    private String roomTypeName;
    private String policyName;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal deltaAmount;
    private Integer dayOfWeekMask;

    public Long getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Long policyId) {
        this.policyId = policyId;
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

    public String getPolicyName() {
        return policyName;
    }

    public void setPolicyName(String policyName) {
        this.policyName = policyName;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getDeltaAmount() {
        return deltaAmount;
    }

    public void setDeltaAmount(BigDecimal deltaAmount) {
        this.deltaAmount = deltaAmount;
    }

    public Integer getDayOfWeekMask() {
        return dayOfWeekMask;
    }

    public void setDayOfWeekMask(Integer dayOfWeekMask) {
        this.dayOfWeekMask = dayOfWeekMask;
    }
}
