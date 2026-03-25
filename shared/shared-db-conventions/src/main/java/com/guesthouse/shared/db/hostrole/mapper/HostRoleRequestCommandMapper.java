package com.guesthouse.shared.db.hostrole.mapper;

import com.guesthouse.shared.db.hostrole.model.HostRoleRequestInsertParam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface HostRoleRequestCommandMapper {

    void insertHostRoleRequest(HostRoleRequestInsertParam hostRoleRequestInsertParam);

    int approveHostRoleRequest(
            @Param("requestId") Long requestId,
            @Param("reviewedBy") Long reviewedBy,
            @Param("reviewedAt") LocalDateTime reviewedAt,
            @Param("reviewReason") String reviewReason,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int denyHostRoleRequest(
            @Param("requestId") Long requestId,
            @Param("reviewedBy") Long reviewedBy,
            @Param("reviewedAt") LocalDateTime reviewedAt,
            @Param("reviewReason") String reviewReason,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}
