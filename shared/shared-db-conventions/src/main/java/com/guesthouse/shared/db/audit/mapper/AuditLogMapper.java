package com.guesthouse.shared.db.audit.mapper;

import com.guesthouse.shared.db.audit.model.AuditLogInsertParam;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper {

    void insertAuditLog(AuditLogInsertParam auditLogInsertParam);
}
