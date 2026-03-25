package com.guesthouse.shared.auth.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
public class SessionAuthenticationService {

    private final UserQueryMapper userQueryMapper;
    private final UserLoginSecurityMapper userLoginSecurityMapper;
    private final PasswordEncoder passwordEncoder;

    public SessionAuthenticationService(
            UserQueryMapper userQueryMapper,
            UserLoginSecurityMapper userLoginSecurityMapper,
            PasswordEncoder passwordEncoder
    ) {
        this.userQueryMapper = userQueryMapper;
        this.userLoginSecurityMapper = userLoginSecurityMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public SessionUser authenticate(LoginCommand loginCommand, Set<UserRole> allowedRoles) {
        UserAuthRecord authRecord = userQueryMapper.findAuthUserByLoginId(loginCommand.loginId());
        if (authRecord == null) {
            throw new AppException(
                    ErrorCode.INVALID_CREDENTIALS,
                    HttpStatus.UNAUTHORIZED,
                    ErrorCode.INVALID_CREDENTIALS.getDefaultMessage()
            );
        }

        userLoginSecurityMapper.insertIfAbsent(authRecord.getUserId());
        authRecord = userQueryMapper.findAuthUserByLoginId(loginCommand.loginId());

        LocalDateTime now = LocalDateTime.now();
        if (authRecord.getLockedUntil() != null && authRecord.getLockedUntil().isAfter(now)) {
            throw new AppException(
                    ErrorCode.ACCOUNT_LOCKED,
                    HttpStatus.LOCKED,
                    ErrorCode.ACCOUNT_LOCKED.getDefaultMessage()
            );
        }

        if (!passwordEncoder.matches(loginCommand.password(), authRecord.getPasswordHash())) {
            userLoginSecurityMapper.registerFailedLogin(authRecord.getUserId(), now);
            throw new AppException(
                    ErrorCode.INVALID_CREDENTIALS,
                    HttpStatus.UNAUTHORIZED,
                    ErrorCode.INVALID_CREDENTIALS.getDefaultMessage()
            );
        }

        if (authRecord.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        if (!allowedRoles.contains(authRecord.getRole())) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        userLoginSecurityMapper.registerSuccessfulLogin(authRecord.getUserId(), now);

        return new SessionUser(
                authRecord.getUserId(),
                authRecord.getLoginId(),
                authRecord.getName(),
                authRecord.getRole()
        );
    }
}
