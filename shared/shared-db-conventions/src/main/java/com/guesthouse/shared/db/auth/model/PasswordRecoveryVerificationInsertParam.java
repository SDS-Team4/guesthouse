package com.guesthouse.shared.db.auth.model;

import com.guesthouse.shared.domain.auth.RecoveryChannel;
import com.guesthouse.shared.domain.auth.RecoveryVerificationType;

import java.time.LocalDateTime;

public class PasswordRecoveryVerificationInsertParam {

    private Long userId;
    private RecoveryVerificationType verificationType;
    private RecoveryChannel channel;
    private String tokenHash;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
