package com.guesthouse.shared.auth.service;

import com.guesthouse.shared.auth.api.FindIdRequest;
import com.guesthouse.shared.auth.api.FindIdVerifyRequest;
import com.guesthouse.shared.auth.api.ResetPasswordConfirmRequest;
import com.guesthouse.shared.auth.api.ResetPasswordRequest;
import com.guesthouse.shared.db.auth.mapper.PasswordRecoveryVerificationMapper;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.auth.model.PasswordRecoveryVerificationInsertParam;
import com.guesthouse.shared.db.auth.model.PasswordRecoveryVerificationRecord;
import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.domain.auth.RecoveryChannel;
import com.guesthouse.shared.domain.auth.RecoveryVerificationStatus;
import com.guesthouse.shared.domain.auth.RecoveryVerificationType;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountRecoveryServiceTest {

    private static final Clock FIXED_CLOCK =
            Clock.fixed(Instant.parse("2026-03-27T01:00:00Z"), ZoneId.of("Asia/Seoul"));

    @Mock
    private UserQueryMapper userQueryMapper;

    @Mock
    private UserAccountCommandMapper userAccountCommandMapper;

    @Mock
    private UserLoginSecurityMapper userLoginSecurityMapper;

    @Mock
    private PasswordRecoveryVerificationMapper passwordRecoveryVerificationMapper;

    @Mock
    private RecoveryMessageDispatchService recoveryMessageDispatchService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AccountRecoveryService accountRecoveryService;

    @BeforeEach
    void setUp() {
        accountRecoveryService = new AccountRecoveryService(
                userQueryMapper,
                userAccountCommandMapper,
                userLoginSecurityMapper,
                passwordRecoveryVerificationMapper,
                recoveryMessageDispatchService,
                passwordEncoder,
                FIXED_CLOCK
        );
    }

    @Test
    void requestFindIdReturnsAcceptedWithoutLeakingMissingAccount() {
        when(userQueryMapper.findActiveUserByNameAndEmail("Guest Demo", "guest@example.com")).thenReturn(null);

        assertTrue(accountRecoveryService.requestFindId(
                new FindIdRequest("Guest Demo", "guest@example.com", null)
        ).accepted());

        verify(passwordRecoveryVerificationMapper, never()).insertVerification(any());
        verify(recoveryMessageDispatchService, never()).sendCode(any(), any(), any(), any());
    }

    @Test
    void requestFindIdCreatesVerificationAndDispatchesCode() {
        when(userQueryMapper.findActiveUserByNameAndEmail("Guest Demo", "guest@example.com"))
                .thenReturn(activeUser());
        when(passwordEncoder.encode(any())).thenReturn("hashed-code");

        assertTrue(accountRecoveryService.requestFindId(
                new FindIdRequest("Guest Demo", "guest@example.com", null)
        ).accepted());

        ArgumentCaptor<PasswordRecoveryVerificationInsertParam> insertCaptor =
                ArgumentCaptor.forClass(PasswordRecoveryVerificationInsertParam.class);
        verify(passwordRecoveryVerificationMapper).insertVerification(insertCaptor.capture());
        PasswordRecoveryVerificationInsertParam insertParam = insertCaptor.getValue();
        assertEquals(101L, insertParam.getUserId());
        assertEquals(RecoveryVerificationType.FIND_ID, insertParam.getVerificationType());
        assertEquals(RecoveryChannel.EMAIL, insertParam.getChannel());
        assertEquals("hashed-code", insertParam.getTokenHash());
        assertEquals(LocalDateTime.of(2026, 3, 27, 10, 10), insertParam.getExpiresAt());

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(recoveryMessageDispatchService).sendCode(
                eq(RecoveryVerificationType.FIND_ID),
                eq(RecoveryChannel.EMAIL),
                eq("guest@example.com"),
                codeCaptor.capture()
        );
        assertTrue(codeCaptor.getValue().matches("\\d{6}"));
    }

    @Test
    void verifyFindIdConsumesVerificationAndReturnsLoginId() {
        when(userQueryMapper.findActiveUserByNameAndEmail("Guest Demo", "guest@example.com"))
                .thenReturn(activeUser());
        when(passwordRecoveryVerificationMapper.findLatestActiveVerification(101L, RecoveryVerificationType.FIND_ID))
                .thenReturn(activeVerification(RecoveryVerificationType.FIND_ID, RecoveryVerificationStatus.PENDING));
        when(passwordEncoder.matches("123456", "stored-token-hash")).thenReturn(true);

        assertEquals(
                "guest.demo",
                accountRecoveryService.verifyFindId(
                        new FindIdVerifyRequest("Guest Demo", "guest@example.com", null, "123456")
                ).loginId()
        );

        verify(passwordRecoveryVerificationMapper).markConsumed(eq(501L), eq(LocalDateTime.of(2026, 3, 27, 10, 0)));
    }

    @Test
    void confirmPasswordResetUpdatesPasswordAndClearsFailureState() {
        when(userQueryMapper.findActiveUserByLoginIdAndNameAndEmail("guest.demo", "Guest Demo", "guest@example.com"))
                .thenReturn(activeUser());
        when(passwordRecoveryVerificationMapper.findLatestActiveVerification(101L, RecoveryVerificationType.RESET_PASSWORD))
                .thenReturn(activeVerification(RecoveryVerificationType.RESET_PASSWORD, RecoveryVerificationStatus.VERIFIED));
        when(passwordEncoder.matches("123456", "stored-token-hash")).thenReturn(true);
        when(passwordEncoder.matches("newguestpass123!", "encoded-current-password")).thenReturn(false);
        when(passwordEncoder.encode("newguestpass123!")).thenReturn("encoded-new-password");
        when(userAccountCommandMapper.updateUserPasswordHash(eq(101L), eq("encoded-new-password"), any())).thenReturn(1);

        assertEquals(
                "2026-03-27T10:00+09:00",
                accountRecoveryService.confirmPasswordReset(
                        new ResetPasswordConfirmRequest(
                                "guest.demo",
                                "Guest Demo",
                                "guest@example.com",
                                null,
                                "123456",
                                "newguestpass123!",
                                "newguestpass123!"
                        )
                ).changedAt().toString()
        );

        verify(userLoginSecurityMapper).markPasswordChanged(101L, LocalDateTime.of(2026, 3, 27, 10, 0));
        verify(userLoginSecurityMapper).clearFailureState(101L);
        verify(passwordRecoveryVerificationMapper).markConsumed(501L, LocalDateTime.of(2026, 3, 27, 10, 0));
    }

    @Test
    void requestPasswordResetHonorsResendCooldown() {
        when(userQueryMapper.findActiveUserByLoginIdAndNameAndEmail("guest.demo", "Guest Demo", "guest@example.com"))
                .thenReturn(activeUser());
        PasswordRecoveryVerificationRecord existing = activeVerification(
                RecoveryVerificationType.RESET_PASSWORD,
                RecoveryVerificationStatus.PENDING
        );
        existing.setCreatedAt(LocalDateTime.of(2026, 3, 27, 9, 59, 30));
        when(passwordRecoveryVerificationMapper.findLatestActiveVerification(101L, RecoveryVerificationType.RESET_PASSWORD))
                .thenReturn(existing);

        assertTrue(accountRecoveryService.requestPasswordReset(
                new ResetPasswordRequest("guest.demo", "Guest Demo", "guest@example.com", null)
        ).accepted());

        verify(passwordRecoveryVerificationMapper, never()).insertVerification(any());
        verify(recoveryMessageDispatchService, never()).sendCode(any(), any(), any(), any());
    }

    private UserAuthRecord activeUser() {
        UserAuthRecord record = new UserAuthRecord();
        record.setUserId(101L);
        record.setLoginId("guest.demo");
        record.setName("Guest Demo");
        record.setEmail("guest@example.com");
        record.setPhone("010-1111-2222");
        record.setRole(UserRole.GUEST);
        record.setStatus(UserStatus.ACTIVE);
        record.setPasswordHash("encoded-current-password");
        return record;
    }

    private PasswordRecoveryVerificationRecord activeVerification(
            RecoveryVerificationType type,
            RecoveryVerificationStatus status
    ) {
        PasswordRecoveryVerificationRecord record = new PasswordRecoveryVerificationRecord();
        record.setVerificationId(501L);
        record.setUserId(101L);
        record.setVerificationType(type);
        record.setChannel(RecoveryChannel.EMAIL);
        record.setTokenHash("stored-token-hash");
        record.setExpiresAt(LocalDateTime.of(2026, 3, 27, 10, 10));
        record.setStatus(status);
        record.setAttemptCount(0);
        record.setCreatedAt(LocalDateTime.of(2026, 3, 27, 9, 45));
        return record;
    }
}
