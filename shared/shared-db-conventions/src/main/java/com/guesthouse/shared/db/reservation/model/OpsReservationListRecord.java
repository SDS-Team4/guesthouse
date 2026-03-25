package com.guesthouse.shared.db.reservation.model;

import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class OpsReservationListRecord {

    private Long reservationId;
    private String reservationNo;
    private Long guestUserId;
    private String guestLoginId;
    private String guestName;
    private Long accommodationId;
    private String accommodationName;
    private Long roomTypeId;
    private String roomTypeName;
    private Integer guestCount;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private ReservationStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
    private boolean reassignmentPossible;
    private boolean hasRelevantBlocks;
    private boolean hasRelevantPricing;

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public String getReservationNo() {
        return reservationNo;
    }

    public void setReservationNo(String reservationNo) {
        this.reservationNo = reservationNo;
    }

    public Long getGuestUserId() {
        return guestUserId;
    }

    public void setGuestUserId(Long guestUserId) {
        this.guestUserId = guestUserId;
    }

    public String getGuestLoginId() {
        return guestLoginId;
    }

    public void setGuestLoginId(String guestLoginId) {
        this.guestLoginId = guestLoginId;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public Long getAccommodationId() {
        return accommodationId;
    }

    public void setAccommodationId(Long accommodationId) {
        this.accommodationId = accommodationId;
    }

    public String getAccommodationName() {
        return accommodationName;
    }

    public void setAccommodationName(String accommodationName) {
        this.accommodationName = accommodationName;
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

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public LocalDate getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(LocalDate checkInDate) {
        this.checkInDate = checkInDate;
    }

    public LocalDate getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(LocalDate checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public boolean isReassignmentPossible() {
        return reassignmentPossible;
    }

    public void setReassignmentPossible(boolean reassignmentPossible) {
        this.reassignmentPossible = reassignmentPossible;
    }

    public boolean isHasRelevantBlocks() {
        return hasRelevantBlocks;
    }

    public void setHasRelevantBlocks(boolean hasRelevantBlocks) {
        this.hasRelevantBlocks = hasRelevantBlocks;
    }

    public boolean isHasRelevantPricing() {
        return hasRelevantPricing;
    }

    public void setHasRelevantPricing(boolean hasRelevantPricing) {
        this.hasRelevantPricing = hasRelevantPricing;
    }
}
