package com.guesthouse.opsapi.roomblock.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.audit.model.AuditLogInsertParam;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class OpsRoomBlockAuditService {

    private static final String TARGET_TYPE_ROOM_BLOCK = "ROOM_BLOCK";

    private final AuditLogMapper auditLogMapper;
    private final ObjectMapper objectMapper;

    public OpsRoomBlockAuditService(AuditLogMapper auditLogMapper, ObjectMapper objectMapper) {
        this.auditLogMapper = auditLogMapper;
        this.objectMapper = objectMapper;
    }

    public void writeRoomBlockAudit(
            SessionUser actor,
            Long blockId,
            String actionType,
            String reasonType,
            String reasonText,
            Object beforeState,
            Object afterState,
            LocalDateTime occurredAt
    ) {
        AuditLogInsertParam auditLogInsertParam = new AuditLogInsertParam();
        auditLogInsertParam.setActorUserId(actor.userId());
        auditLogInsertParam.setTargetType(TARGET_TYPE_ROOM_BLOCK);
        auditLogInsertParam.setTargetId(blockId);
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
            throw new IllegalStateException("Failed to serialize room block audit state.", exception);
        }
    }
}
