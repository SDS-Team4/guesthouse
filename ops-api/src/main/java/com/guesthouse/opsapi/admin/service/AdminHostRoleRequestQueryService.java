package com.guesthouse.opsapi.admin.service;

import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.HostRoleRequestStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminHostRoleRequestQueryService {

    private final HostRoleRequestQueryMapper hostRoleRequestQueryMapper;

    public AdminHostRoleRequestQueryService(HostRoleRequestQueryMapper hostRoleRequestQueryMapper) {
        this.hostRoleRequestQueryMapper = hostRoleRequestQueryMapper;
    }

    public List<HostRoleRequestRecord> findRequests(String status) {
        return hostRoleRequestQueryMapper.findRequestsForAdmin(parseStatus(status));
    }

    public HostRoleRequestRecord getRequestDetail(Long requestId) {
        HostRoleRequestRecord record = hostRoleRequestQueryMapper.findRequestById(requestId);
        if (record == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Host role request not found.");
        }
        return record;
    }

    private HostRoleRequestStatus parseStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        try {
            return HostRoleRequestStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException illegalArgumentException) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Invalid host role request status filter.");
        }
    }
}
