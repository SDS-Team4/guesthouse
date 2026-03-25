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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestHostRoleRequestServiceTest {

    @Mock
    private UserAccountQueryMapper userAccountQueryMapper;

    @Mock
    private HostRoleRequestQueryMapper hostRoleRequestQueryMapper;

    @Mock
    private HostRoleRequestCommandMapper hostRoleRequestCommandMapper;

    @Mock
    private GuestHostRoleRequestAuditService guestHostRoleRequestAuditService;

    private GuestHostRoleRequestService guestHostRoleRequestService;

    @BeforeEach
    void setUp() {
        guestHostRoleRequestService = new GuestHostRoleRequestService(
                userAccountQueryMapper,
                hostRoleRequestQueryMapper,
                hostRoleRequestCommandMapper,
                guestHostRoleRequestAuditService,
                Clock.fixed(Instant.parse("2026-03-25T01:00:00Z"), ZoneId.of("Asia/Seoul"))
        );
    }

    @Test
    void createRequestStoresPendingRequestForActiveGuest() {
        when(userAccountQueryMapper.findUserAccountByUserId(101L)).thenReturn(activeGuest());
        when(hostRoleRequestQueryMapper.findPendingRequestByUserId(101L)).thenReturn(null);
        when(hostRoleRequestQueryMapper.findApprovedRequestIdByUserId(101L)).thenReturn(null);
        doAnswer(invocation -> {
            HostRoleRequestInsertParam insertParam = invocation.getArgument(0);
            insertParam.setRequestId(401L);
            return null;
        }).when(hostRoleRequestCommandMapper).insertHostRoleRequest(any(HostRoleRequestInsertParam.class));
        when(hostRoleRequestQueryMapper.findRequestById(401L)).thenReturn(requestRecord(401L, HostRoleRequestStatus.PENDING));

        GuestHostRoleRequestStateView view =
                guestHostRoleRequestService.createRequest(
                        new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST),
                        "I need host access for my guesthouse."
                );

        assertFalse(view.canSubmitNewRequest());
        assertEquals(HostRoleRequestStatus.PENDING, view.latestRequest().getStatus());
        verify(hostRoleRequestCommandMapper).insertHostRoleRequest(any(HostRoleRequestInsertParam.class));
        verify(guestHostRoleRequestAuditService).writeCreateAudit(any(), any(), any(), any());
    }

    @Test
    void createRequestRejectsPendingDuplicate() {
        when(userAccountQueryMapper.findUserAccountByUserId(101L)).thenReturn(activeGuest());
        when(hostRoleRequestQueryMapper.findPendingRequestByUserId(101L)).thenReturn(requestRecord(301L, HostRoleRequestStatus.PENDING));

        AppException exception = assertThrows(
                AppException.class,
                () -> guestHostRoleRequestService.createRequest(
                        new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST),
                        "Another request"
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.HOST_ROLE_REQUEST_ALREADY_PENDING, exception.getErrorCode());
    }

    private UserAccountRecord activeGuest() {
        UserAccountRecord record = new UserAccountRecord();
        record.setUserId(101L);
        record.setLoginId("guest.demo");
        record.setName("Guest Demo");
        record.setRole(UserRole.GUEST);
        record.setStatus(UserStatus.ACTIVE);
        return record;
    }

    private HostRoleRequestRecord requestRecord(Long requestId, HostRoleRequestStatus status) {
        HostRoleRequestRecord record = new HostRoleRequestRecord();
        record.setRequestId(requestId);
        record.setUserId(101L);
        record.setUserLoginId("guest.demo");
        record.setUserName("Guest Demo");
        record.setUserRole(UserRole.GUEST);
        record.setUserStatus(UserStatus.ACTIVE);
        record.setRequestReason("Need host access");
        record.setStatus(status);
        return record;
    }
}
