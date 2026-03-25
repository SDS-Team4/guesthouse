package com.guesthouse.shared.db.hostrole.mapper;

import com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord;
import com.guesthouse.shared.domain.user.HostRoleRequestStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HostRoleRequestQueryMapper {

    HostRoleRequestRecord findLatestRequestByUserId(@Param("userId") Long userId);

    HostRoleRequestRecord findPendingRequestByUserId(@Param("userId") Long userId);

    Long findApprovedRequestIdByUserId(@Param("userId") Long userId);

    List<HostRoleRequestRecord> findRequestsForAdmin(@Param("status") HostRoleRequestStatus status);

    HostRoleRequestRecord findRequestById(@Param("requestId") Long requestId);

    HostRoleRequestRecord lockRequestById(@Param("requestId") Long requestId);
}
