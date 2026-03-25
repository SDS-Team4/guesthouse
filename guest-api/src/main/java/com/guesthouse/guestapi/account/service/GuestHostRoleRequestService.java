package com.guesthouse.guestapi.account.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.hostrole.model.HostRoleRequestInsertParam;
import com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.db.user.model.UserAccountRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.HostRoleRequestStatus;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class GuestHostRoleRequestService {

    private final UserAccountQueryMapper userAccountQueryMapper;
    private final HostRoleRequestQueryMapper hostRoleRequestQueryMapper;
    private final HostRoleRequestCommandMapper hostRoleRequestCommandMapper;
    private final GuestHostRoleRequestAuditService guestHostRoleRequestAuditService;
    private final Clock clock;

    public GuestHostRoleRequestService(
            UserAccountQueryMapper userAccountQueryMapper,
            HostRoleRequestQueryMapper hostRoleRequestQueryMapper,
            HostRoleRequestCommandMapper hostRoleRequestCommandMapper,
            GuestHostRoleRequestAuditService guestHostRoleRequestAuditService,
            Clock clock
    ) {
        this.userAccountQueryMapper = userAccountQueryMapper;
        this.hostRoleRequestQueryMapper = hostRoleRequestQueryMapper;
        this.hostRoleRequestCommandMapper = hostRoleRequestCommandMapper;
        this.guestHostRoleRequestAuditService = guestHostRoleRequestAuditService;
        this.clock = clock;
    }

    public GuestHostRoleRequestStateView getRequestState(Long userId) {
        UserAccountRecord user = requireUser(userId);
        HostRoleRequestRecord latestRequest = hostRoleRequestQueryMapper.findLatestRequestByUserId(userId);
        return buildStateView(user, latestRequest);
    }

    @Transactional
    public GuestHostRoleRequestStateView createRequest(SessionUser sessionUser, String requestReason) {
        UserAccountRecord user = requireUser(sessionUser.userId());
        HostRoleRequestRecord pendingRequest = hostRoleRequestQueryMapper.findPendingRequestByUserId(sessionUser.userId());
        if (pendingRequest != null) {
            throw new AppException(ErrorCode.HOST_ROLE_REQUEST_ALREADY_PENDING, HttpStatus.CONFLICT);
        }
        if (user.getStatus() != UserStatus.ACTIVE || user.getRole() != UserRole.GUEST) {
            throw new AppException(
                    ErrorCode.HOST_ROLE_REQUEST_NOT_ALLOWED,
                    HttpStatus.CONFLICT,
                    "Only active guest accounts can request host role."
            );
        }
        if (hostRoleRequestQueryMapper.findApprovedRequestIdByUserId(sessionUser.userId()) != null) {
            throw new AppException(
                    ErrorCode.HOST_ROLE_REQUEST_ALREADY_REVIEWED,
                    HttpStatus.CONFLICT,
                    "Host role has already been approved for this account."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        HostRoleRequestInsertParam insertParam = new HostRoleRequestInsertParam();
        insertParam.setUserId(sessionUser.userId());
        insertParam.setRequestReason(normalizeReason(requestReason));
        insertParam.setStatus(HostRoleRequestStatus.PENDING);
        insertParam.setCreatedAt(now);
        insertParam.setUpdatedAt(now);
        hostRoleRequestCommandMapper.insertHostRoleRequest(insertParam);

        guestHostRoleRequestAuditService.writeCreateAudit(
                sessionUser,
                insertParam.getRequestId(),
                buildAuditState(insertParam),
                now
        );

        HostRoleRequestRecord latestRequest = hostRoleRequestQueryMapper.findRequestById(insertParam.getRequestId());
        return buildStateView(user, latestRequest);
    }

    private UserAccountRecord requireUser(Long userId) {
        UserAccountRecord user = userAccountQueryMapper.findUserAccountByUserId(userId);
        if (user == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "User not found.");
        }
        return user;
    }

    private GuestHostRoleRequestStateView buildStateView(UserAccountRecord user, HostRoleRequestRecord latestRequest) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            return new GuestHostRoleRequestStateView(
                    user.getRole(),
                    false,
                    "Only active accounts can request host role.",
                    latestRequest
            );
        }
        if (user.getRole() != UserRole.GUEST) {
            return new GuestHostRoleRequestStateView(
                    user.getRole(),
                    false,
                    "This account already requires fresh ops login instead of another host-role request.",
                    latestRequest
            );
        }
        if (latestRequest == null) {
            return new GuestHostRoleRequestStateView(user.getRole(), true, null, null);
        }
        if (latestRequest.getStatus() == HostRoleRequestStatus.PENDING) {
            return new GuestHostRoleRequestStateView(
                    user.getRole(),
                    false,
                    "A host role request is already pending review.",
                    latestRequest
            );
        }
        if (latestRequest.getStatus() == HostRoleRequestStatus.APPROVED) {
            return new GuestHostRoleRequestStateView(
                    user.getRole(),
                    false,
                    "Host role has already been approved. Sign in again through ops-web.",
                    latestRequest
            );
        }
        return new GuestHostRoleRequestStateView(
                user.getRole(),
                true,
                null,
                latestRequest
        );
    }

    private String normalizeReason(String requestReason) {
        if (requestReason == null || requestReason.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Request reason is required.");
        }
        return requestReason.trim();
    }

    private Map<String, Object> buildAuditState(HostRoleRequestInsertParam insertParam) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("userId", insertParam.getUserId());
        state.put("status", insertParam.getStatus());
        state.put("requestReason", insertParam.getRequestReason());
        state.put("createdAt", insertParam.getCreatedAt());
        return state;
    }
}
