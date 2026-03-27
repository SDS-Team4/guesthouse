package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionIntegrityServiceTest {

    @Mock
    private UserQueryMapper userQueryMapper;

    @Test
    void validateRejectsRuntimeMismatchWithoutDbLookup() {
        AppRuntimeProperties appRuntimeProperties = new AppRuntimeProperties();
        appRuntimeProperties.setRuntimeName("guest-api");
        SessionIntegrityService service = new SessionIntegrityService(userQueryMapper, appRuntimeProperties);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionAuthConstants.SESSION_RUNTIME_ATTRIBUTE, "ops-api");

        assertThrows(AppException.class, () -> service.validate(
                session,
                new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST)
        ));
        verifyNoInteractions(userQueryMapper);
    }

    @Test
    void validateRejectsPasswordChangedAfterAuthentication() {
        AppRuntimeProperties appRuntimeProperties = new AppRuntimeProperties();
        appRuntimeProperties.setRuntimeName("guest-api");
        SessionIntegrityService service = new SessionIntegrityService(userQueryMapper, appRuntimeProperties);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionAuthConstants.SESSION_RUNTIME_ATTRIBUTE, "guest-api");
        session.setAttribute(
                SessionAuthConstants.SESSION_AUTHENTICATED_AT_ATTRIBUTE,
                LocalDateTime.of(2026, 3, 26, 10, 0)
        );

        UserAuthRecord record = new UserAuthRecord();
        record.setUserId(101L);
        record.setRole(UserRole.GUEST);
        record.setStatus(UserStatus.ACTIVE);
        record.setPasswordChangedAt(LocalDateTime.of(2026, 3, 26, 10, 5));
        when(userQueryMapper.findAuthUserByUserId(101L)).thenReturn(record);

        assertThrows(AppException.class, () -> service.validate(
                session,
                new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST)
        ));
    }

    @Test
    void validateAllowsSessionWhenMetadataIsAbsent() {
        AppRuntimeProperties appRuntimeProperties = new AppRuntimeProperties();
        SessionIntegrityService service = new SessionIntegrityService(userQueryMapper, appRuntimeProperties);

        assertDoesNotThrow(() -> service.validate(
                new MockHttpSession(),
                new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST)
        ));
        verifyNoInteractions(userQueryMapper);
    }
}
