package com.guesthouse.opsapi.reservation.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.audit.model.AuditLogInsertParam;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class OpsReservationAuditService {

    private static final String TARGET_TYPE_RESERVATION = "RESERVATION";

    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper;

    public OpsReservationAuditService(AuditLogMapper auditLogMapper, ObjectMapper objectMapper) {
        this.auditLogMapper = auditLogMapper;
        this.objectMapper = objectMapper;
    }

    public void writeReservationAudit(
            SessionUser actor,
            Long reservationId,
            String actionType,
            String reasonType,
            String reasonText,
            Object beforeState,
            Object afterState,
            LocalDateTime occurredAt
    ) {
        AuditLogInsertParam auditLogInsertParam = new AuditLogInsertParam();
        auditLogInsertParam.setActorUserId(actor.userId());
        auditLogInsertParam.setTargetType(TARGET_TYPE_RESERVATION);
        auditLogInsertParam.setTargetId(reservationId);
        auditLogInsertParam.setActionType(actionType);
        auditLogInsertParam.setReasonType(reasonType);
        auditLogInsertParam.setReasonText(reasonText);
        auditLogInsertParam.setBeforeStateJson(toJson(beforeState));
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
            throw new IllegalStateException("Failed to serialize audit log state.", exception);
        }
    }
}
