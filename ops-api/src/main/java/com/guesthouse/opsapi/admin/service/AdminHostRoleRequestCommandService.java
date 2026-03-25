package com.guesthouse.opsapi.admin.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
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
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AdminHostRoleRequestCommandService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final HostRoleRequestQueryMapper hostRoleRequestQueryMapper;
    private final HostRoleRequestCommandMapper hostRoleRequestCommandMapper;
    private final UserAccountCommandMapper userAccountCommandMapper;
    private final AdminHostRoleRequestAuditService adminHostRoleRequestAuditService;
    private final Clock clock;

    public AdminHostRoleRequestCommandService(
            HostRoleRequestQueryMapper hostRoleRequestQueryMapper,
            HostRoleRequestCommandMapper hostRoleRequestCommandMapper,
            UserAccountCommandMapper userAccountCommandMapper,
            AdminHostRoleRequestAuditService adminHostRoleRequestAuditService,
            Clock clock
    ) {
        this.hostRoleRequestQueryMapper = hostRoleRequestQueryMapper;
        this.hostRoleRequestCommandMapper = hostRoleRequestCommandMapper;
        this.userAccountCommandMapper = userAccountCommandMapper;
        this.adminHostRoleRequestAuditService = adminHostRoleRequestAuditService;
        this.clock = clock;
    }

    @Transactional
    public AdminHostRoleRequestMutationResult approveRequest(Long requestId, SessionUser actor, String reviewReason) {
        HostRoleRequestRecord target = lockPendingRequest(requestId);
        requireEligibleRequester(target);

        LocalDateTime now = LocalDateTime.now(clock);
        int requestRows = hostRoleRequestCommandMapper.approveHostRoleRequest(
                requestId,
                actor.userId(),
                now,
                normalizeOptional(reviewReason),
                now
        );
        if (requestRows != 1) {
            throw alreadyReviewed();
        }

        int userRows = userAccountCommandMapper.promoteUserToHost(target.getUserId(), UserRole.GUEST, now);
        if (userRows != 1) {
            throw new AppException(
                    ErrorCode.HOST_ROLE_REQUEST_NOT_ALLOWED,
                    HttpStatus.CONFLICT,
                    "User is no longer eligible for host role approval."
            );
        }

        adminHostRoleRequestAuditService.writeDecisionAudit(
                actor,
                requestId,
                "HOST_ROLE_REQUEST_APPROVED",
                "Host role request approved by admin.",
                buildAuditState(target, target.getUserRole()),
                buildAuditState(target, UserRole.HOST),
                now
        );

        return new AdminHostRoleRequestMutationResult(
                requestId,
                target.getUserId(),
                HostRoleRequestStatus.APPROVED,
                UserRole.HOST,
                normalizeOptional(reviewReason),
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    @Transactional
    public AdminHostRoleRequestMutationResult rejectRequest(Long requestId, SessionUser actor, String reviewReason) {
        HostRoleRequestRecord target = lockPendingRequest(requestId);
        String normalizedReviewReason = normalizeRequiredReviewReason(reviewReason);
        LocalDateTime now = LocalDateTime.now(clock);

        int updatedRows = hostRoleRequestCommandMapper.denyHostRoleRequest(
                requestId,
                actor.userId(),
                now,
                normalizedReviewReason,
                now
        );
        if (updatedRows != 1) {
            throw alreadyReviewed();
        }

        adminHostRoleRequestAuditService.writeDecisionAudit(
                actor,
                requestId,
                "HOST_ROLE_REQUEST_REJECTED",
                normalizedReviewReason,
                buildAuditState(target, target.getUserRole()),
                buildRejectedAuditState(target, normalizedReviewReason),
                now
        );

        return new AdminHostRoleRequestMutationResult(
                requestId,
                target.getUserId(),
                HostRoleRequestStatus.DENIED,
                target.getUserRole(),
                normalizedReviewReason,
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private HostRoleRequestRecord lockPendingRequest(Long requestId) {
        HostRoleRequestRecord target = hostRoleRequestQueryMapper.lockRequestById(requestId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Host role request not found.");
        }
        if (target.getStatus() != HostRoleRequestStatus.PENDING) {
            throw alreadyReviewed();
        }
        return target;
    }

    private void requireEligibleRequester(HostRoleRequestRecord target) {
        if (target.getUserStatus() != UserStatus.ACTIVE || target.getUserRole() != UserRole.GUEST) {
            throw new AppException(
                    ErrorCode.HOST_ROLE_REQUEST_NOT_ALLOWED,
                    HttpStatus.CONFLICT,
                    "Only active guest accounts can be approved for host role."
            );
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeRequiredReviewReason(String reviewReason) {
        String normalized = normalizeOptional(reviewReason);
        if (normalized == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Reject reason is required.");
        }
        return normalized;
    }

    private AppException alreadyReviewed() {
        return new AppException(ErrorCode.HOST_ROLE_REQUEST_ALREADY_REVIEWED, HttpStatus.CONFLICT);
    }

    private Map<String, Object> buildAuditState(HostRoleRequestRecord target, UserRole resultingRole) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("requestId", target.getRequestId());
        state.put("userId", target.getUserId());
        state.put("requestStatus", target.getStatus());
        state.put("userRole", resultingRole);
        state.put("userStatus", target.getUserStatus());
        state.put("requestReason", target.getRequestReason());
        return state;
    }

    private Map<String, Object> buildRejectedAuditState(HostRoleRequestRecord target, String reviewReason) {
        Map<String, Object> state = buildAuditState(target, target.getUserRole());
        state.put("requestStatus", HostRoleRequestStatus.DENIED);
        state.put("reviewReason", reviewReason);
        return state;
    }
}
