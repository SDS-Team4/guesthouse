package com.guesthouse.guestapi.account.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.audit.model.AuditLogInsertParam;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class GuestHostRoleRequestAuditService {

    private static final String TARGET_TYPE_HOST_ROLE_REQUEST = "HOST_ROLE_REQUEST";

    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper;

    public GuestHostRoleRequestAuditService(AuditLogMapper auditLogMapper, ObjectMapper objectMapper) {
        this.auditLogMapper = auditLogMapper;
        this.objectMapper = objectMapper;
    }

    public void writeCreateAudit(
            SessionUser actor,
            Long requestId,
            Object afterState,
            LocalDateTime occurredAt
    ) {
        AuditLogInsertParam auditLogInsertParam = new AuditLogInsertParam();
        auditLogInsertParam.setActorUserId(actor.userId());
        auditLogInsertParam.setTargetType(TARGET_TYPE_HOST_ROLE_REQUEST);
        auditLogInsertParam.setTargetId(requestId);
        auditLogInsertParam.setActionType("HOST_ROLE_REQUEST_CREATED");
        auditLogInsertParam.setReasonType("GUEST_REQUEST");
        auditLogInsertParam.setReasonText("Host role request created by guest.");
        auditLogInsertParam.setBeforeStateJson(null);
        auditLogInsertParam.setAfterStateJson(toJson(afterState));
        auditLogInsertParam.setOccurredAt(occurredAt);
        auditLogMapper.insertAuditLog(auditLogInsertParam);
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize host role request audit state.", exception);
        }
    }
}
