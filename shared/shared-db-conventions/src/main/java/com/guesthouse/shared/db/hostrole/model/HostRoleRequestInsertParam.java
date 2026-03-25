package com.guesthouse.shared.db.hostrole.model;

import com.guesthouse.shared.domain.user.HostRoleRequestStatus;

import java.time.LocalDateTime;

public class HostRoleRequestInsertParam {

    private Long requestId;
    private Long userId;
    private String requestReason;
    private HostRoleRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getRequestReason() {
        return requestReason;
    }

    public void setRequestReason(String requestReason) {
        this.requestReason = requestReason;
    }

    public HostRoleRequestStatus getStatus() {
        return status;
    }

    public void setStatus(HostRoleRequestStatus status) {
        this.status = status;
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
