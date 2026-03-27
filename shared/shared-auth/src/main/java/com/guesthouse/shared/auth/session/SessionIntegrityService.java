package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.config.AppRuntimeProperties;
import com.guesthouse.shared.domain.user.UserStatus;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class SessionIntegrityService {

    private final UserQueryMapper userQueryMapper;
    private final AppRuntimeProperties appRuntimeProperties;

    public SessionIntegrityService(
            UserQueryMapper userQueryMapper,
            AppRuntimeProperties appRuntimeProperties
    ) {
        this.userQueryMapper = userQueryMapper;
        this.appRuntimeProperties = appRuntimeProperties;
    }

    public void validate(HttpSession session, SessionUser sessionUser) {
        Object runtimeName = session.getAttribute(SessionAuthConstants.SESSION_RUNTIME_ATTRIBUTE);
        if (runtimeName instanceof String sessionRuntimeName
                && !appRuntimeProperties.getRuntimeName().equals(sessionRuntimeName)) {
            invalidateAndThrow(session, ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        Object authenticatedAtValue = session.getAttribute(SessionAuthConstants.SESSION_AUTHENTICATED_AT_ATTRIBUTE);
        if (!(authenticatedAtValue instanceof LocalDateTime authenticatedAt)) {
            return;
        }

        UserAuthRecord currentRecord = userQueryMapper.findAuthUserByUserId(sessionUser.userId());
        if (currentRecord == null || currentRecord.getStatus() != UserStatus.ACTIVE) {
            invalidateAndThrow(session, ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        if (currentRecord.getRole() != sessionUser.role()) {
            invalidateAndThrow(session, ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        LocalDateTime passwordChangedAt = currentRecord.getPasswordChangedAt();
        if (passwordChangedAt != null && authenticatedAt.isBefore(passwordChangedAt)) {
            invalidateAndThrow(session, ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }
    }

    private void invalidateAndThrow(HttpSession session, ErrorCode errorCode, HttpStatus status) {
        session.invalidate();
        throw new AppException(errorCode, status, errorCode.getDefaultMessage());
    }
}
