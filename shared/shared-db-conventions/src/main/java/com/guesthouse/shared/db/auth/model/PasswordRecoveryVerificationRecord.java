package com.guesthouse.shared.db.auth.model;

import com.guesthouse.shared.domain.auth.RecoveryChannel;
import com.guesthouse.shared.domain.auth.RecoveryVerificationStatus;
import com.guesthouse.shared.domain.auth.RecoveryVerificationType;

import java.time.LocalDateTime;

public class PasswordRecoveryVerificationRecord {

    private Long verificationId;
    private Long userId;
    private RecoveryVerificationType verificationType;
    private RecoveryChannel channel;
    private String tokenHash;
    private LocalDateTime expiresAt;
    private LocalDateTime consumedAt;
    private RecoveryVerificationStatus status;
    private Integer attemptCount;
    private LocalDateTime createdAt;

    public Long getVerificationId() {
        return verificationId;
    }

    public void setVerificationId(Long verificationId) {
        this.verificationId = verificationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public RecoveryVerificationType getVerificationType() {
        return verificationType;
    }

    public void setVerificationType(RecoveryVerificationType verificationType) {
        this.verificationType = verificationType;
    }

    public RecoveryChannel getChannel() {
        return channel;
    }

    public void setChannel(RecoveryChannel channel) {
        this.channel = channel;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getConsumedAt() {
        return consumedAt;
    }

    public void setConsumedAt(LocalDateTime consumedAt) {
        this.consumedAt = consumedAt;
    }

    public RecoveryVerificationStatus getStatus() {
        return status;
    }

    public void setStatus(RecoveryVerificationStatus status) {
        this.status = status;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(Integer attemptCount) {
        this.attemptCount = attemptCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
