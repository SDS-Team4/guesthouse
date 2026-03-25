package com.guesthouse.shared.auth.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.EnumSet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionAuthenticationServiceTest {

    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    @Mock
    private UserQueryMapper userQueryMapper;

    @Mock
    private UserLoginSecurityMapper userLoginSecurityMapper;

    private SessionAuthenticationService sessionAuthenticationService;

    @BeforeEach
    void setUp() {
        sessionAuthenticationService = new SessionAuthenticationService(
                userQueryMapper,
                userLoginSecurityMapper,
                PASSWORD_ENCODER
        );
    }

    @Test
    void authenticateSucceedsForAllowedRole() {
        UserAuthRecord authRecord = activeUser("guest-demo", UserRole.GUEST, null);
        when(userQueryMapper.findAuthUserByLoginId("guest-demo"))
                .thenReturn(authRecord)
                .thenReturn(authRecord);

        SessionUser sessionUser = sessionAuthenticationService.authenticate(
                new LoginCommand("guest-demo", "guestpass"),
                EnumSet.of(UserRole.GUEST)
        );

        assertEquals(101L, sessionUser.userId());
        assertEquals(UserRole.GUEST, sessionUser.role());
        verify(userLoginSecurityMapper).insertIfAbsent(101L);
        verify(userLoginSecurityMapper).registerSuccessfulLogin(eq(101L), any(LocalDateTime.class));
    }

    @Test
    void authenticateRegistersFailedLoginForWrongPassword() {
        UserAuthRecord authRecord = activeUser("guest-demo", UserRole.GUEST, null);
        when(userQueryMapper.findAuthUserByLoginId("guest-demo"))
                .thenReturn(authRecord)
                .thenReturn(authRecord);

        AppException exception = assertThrows(
                AppException.class,
                () -> sessionAuthenticationService.authenticate(
                        new LoginCommand("guest-demo", "wrong-pass"),
                        EnumSet.of(UserRole.GUEST)
                )
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        verify(userLoginSecurityMapper).insertIfAbsent(101L);
        verify(userLoginSecurityMapper).registerFailedLogin(eq(101L), any(LocalDateTime.class));
    }

    @Test
    void authenticateRejectsLockedAccount() {
        UserAuthRecord authRecord = activeUser(
                "guest-demo",
                UserRole.GUEST,
                LocalDateTime.now().plusMinutes(10)
        );
        when(userQueryMapper.findAuthUserByLoginId("guest-demo"))
                .thenReturn(authRecord)
                .thenReturn(authRecord);

        AppException exception = assertThrows(
                AppException.class,
                () -> sessionAuthenticationService.authenticate(
                        new LoginCommand("guest-demo", "guestpass"),
                        EnumSet.of(UserRole.GUEST)
                )
        );

        assertEquals(HttpStatus.LOCKED, exception.getStatus());
        verify(userLoginSecurityMapper).insertIfAbsent(101L);
        verify(userLoginSecurityMapper, times(0)).registerFailedLogin(eq(101L), any(LocalDateTime.class));
        verify(userLoginSecurityMapper, times(0)).registerSuccessfulLogin(eq(101L), any(LocalDateTime.class));
    }

    private UserAuthRecord activeUser(String loginId, UserRole role, LocalDateTime lockedUntil) {
        UserAuthRecord record = new UserAuthRecord();
        record.setUserId(101L);
        record.setLoginId(loginId);
        record.setPasswordHash(PASSWORD_ENCODER.encode("guestpass"));
        record.setName("Guest Demo");
        record.setRole(role);
        record.setStatus(UserStatus.ACTIVE);
        record.setLockedUntil(lockedUntil);
        record.setFailedLoginCount(0);
        return record;
    }
}
