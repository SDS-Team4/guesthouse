package com.guesthouse.shared.db.term.model;

import java.time.LocalDateTime;

public class UserTermAgreementInsertParam {

    private Long userId;
    private Long termId;
    private LocalDateTime agreedAt;
    private String termVersionSnapshot;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getTermId() {
        return termId;
    }

    public void setTermId(Long termId) {
        this.termId = termId;
    }

    public LocalDateTime getAgreedAt() {
        return agreedAt;
    }

    public void setAgreedAt(LocalDateTime agreedAt) {
        this.agreedAt = agreedAt;
    }

    public String getTermVersionSnapshot() {
        return termVersionSnapshot;
    }

    public void setTermVersionSnapshot(String termVersionSnapshot) {
        this.termVersionSnapshot = termVersionSnapshot;
    }
}
