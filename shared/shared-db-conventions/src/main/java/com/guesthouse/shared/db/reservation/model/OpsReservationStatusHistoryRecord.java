package com.guesthouse.shared.db.reservation.model;

import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;

import java.time.LocalDateTime;

public class OpsReservationStatusHistoryRecord {

    private Long historyId;
    private ReservationStatus fromStatus;
    private ReservationStatus toStatus;
    private ReservationActionType actionType;
    private Long changedByUserId;
    private String changedByLoginId;
    private String changedByName;
    private String reasonType;
    private String reasonText;
    private LocalDateTime changedAt;

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public ReservationStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(ReservationStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public ReservationStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(ReservationStatus toStatus) {
        this.toStatus = toStatus;
    }

    public ReservationActionType getActionType() {
        return actionType;
    }

    public void setActionType(ReservationActionType actionType) {
        this.actionType = actionType;
    }

    public Long getChangedByUserId() {
        return changedByUserId;
    }

    public void setChangedByUserId(Long changedByUserId) {
        this.changedByUserId = changedByUserId;
    }

    public String getChangedByLoginId() {
        return changedByLoginId;
    }

    public void setChangedByLoginId(String changedByLoginId) {
        this.changedByLoginId = changedByLoginId;
    }

    public String getChangedByName() {
        return changedByName;
    }

    public void setChangedByName(String changedByName) {
        this.changedByName = changedByName;
    }

    public String getReasonType() {
        return reasonType;
    }

    public void setReasonType(String reasonType) {
        this.reasonType = reasonType;
    }

    public String getReasonText() {
        return reasonText;
    }

    public void setReasonText(String reasonText) {
        this.reasonText = reasonText;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }
}
