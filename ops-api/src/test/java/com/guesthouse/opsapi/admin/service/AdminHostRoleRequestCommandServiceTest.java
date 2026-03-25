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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminHostRoleRequestCommandServiceTest {

    @Mock
    private HostRoleRequestQueryMapper hostRoleRequestQueryMapper;

    @Mock
    private HostRoleRequestCommandMapper hostRoleRequestCommandMapper;

    @Mock
    private UserAccountCommandMapper userAccountCommandMapper;

    @Mock
    private AdminHostRoleRequestAuditService adminHostRoleRequestAuditService;

    private AdminHostRoleRequestCommandService adminHostRoleRequestCommandService;

    @BeforeEach
    void setUp() {
        adminHostRoleRequestCommandService = new AdminHostRoleRequestCommandService(
                hostRoleRequestQueryMapper,
                hostRoleRequestCommandMapper,
                userAccountCommandMapper,
                adminHostRoleRequestAuditService,
                Clock.fixed(Instant.parse("2026-03-25T01:00:00Z"), ZoneId.of("Asia/Seoul"))
        );
    }

    @Test
    void approveRequestPromotesGuestToHost() {
        when(hostRoleRequestQueryMapper.lockRequestById(401L)).thenReturn(pendingRequest());
        when(hostRoleRequestCommandMapper.approveHostRoleRequest(eq(401L), eq(103L), any(), eq(null), any())).thenReturn(1);
        when(userAccountCommandMapper.promoteUserToHost(eq(101L), eq(UserRole.GUEST), any())).thenReturn(1);

        AdminHostRoleRequestMutationResult result =
                adminHostRoleRequestCommandService.approveRequest(401L, adminActor(), null);

        assertEquals(HostRoleRequestStatus.APPROVED, result.status());
        assertEquals(UserRole.HOST, result.userRole());
        verify(adminHostRoleRequestAuditService).writeDecisionAudit(any(), eq(401L), eq("HOST_ROLE_REQUEST_APPROVED"), any(), any(), any(), any());
    }

    @Test
    void rejectRequestRequiresReason() {
        when(hostRoleRequestQueryMapper.lockRequestById(401L)).thenReturn(pendingRequest());

        AppException exception = assertThrows(
                AppException.class,
                () -> adminHostRoleRequestCommandService.rejectRequest(401L, adminActor(), " ")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
    }

    private HostRoleRequestRecord pendingRequest() {
        HostRoleRequestRecord record = new HostRoleRequestRecord();
        record.setRequestId(401L);
        record.setUserId(101L);
        record.setUserLoginId("guest.demo");
        record.setUserName("Guest Demo");
        record.setUserRole(UserRole.GUEST);
        record.setUserStatus(UserStatus.ACTIVE);
        record.setRequestReason("Need host access");
        record.setStatus(HostRoleRequestStatus.PENDING);
        return record;
    }

    private SessionUser adminActor() {
        return new SessionUser(103L, "admin.demo", "Admin Demo", UserRole.ADMIN);
    }
}
