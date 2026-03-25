package com.guesthouse.guestapi.auth.service;

import com.guesthouse.guestapi.auth.api.SignupRequest;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.db.user.model.UserInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class GuestSignupService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final UserAccountQueryMapper userAccountQueryMapper;
    private final UserAccountCommandMapper userAccountCommandMapper;
    private final UserLoginSecurityMapper userLoginSecurityMapper;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public GuestSignupService(
            UserAccountQueryMapper userAccountQueryMapper,
            UserAccountCommandMapper userAccountCommandMapper,
            UserLoginSecurityMapper userLoginSecurityMapper,
            PasswordEncoder passwordEncoder,
            Clock clock
    ) {
        this.userAccountQueryMapper = userAccountQueryMapper;
        this.userAccountCommandMapper = userAccountCommandMapper;
        this.userLoginSecurityMapper = userLoginSecurityMapper;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional
    public GuestSignupResult signup(SignupRequest request) {
        String loginId = normalizeRequired(request.loginId(), "Login ID is required.");
        String password = request.password();
        String name = normalizeRequired(request.name(), "Name is required.");
        String email = normalizeOptional(request.email());
        String phone = normalizeOptional(request.phone());

        if (userAccountQueryMapper.findUserIdByLoginId(loginId) != null) {
            throw new AppException(ErrorCode.DUPLICATE_LOGIN_ID, HttpStatus.CONFLICT);
        }
        if (email != null && userAccountQueryMapper.findUserIdByEmail(email) != null) {
            throw new AppException(ErrorCode.DUPLICATE_EMAIL, HttpStatus.CONFLICT);
        }
        if (phone != null && userAccountQueryMapper.findUserIdByPhone(phone) != null) {
            throw new AppException(ErrorCode.DUPLICATE_PHONE, HttpStatus.CONFLICT);
        }

        LocalDateTime now = LocalDateTime.now(clock);
        UserInsertParam userInsertParam = new UserInsertParam();
        userInsertParam.setLoginId(loginId);
        userInsertParam.setPasswordHash(passwordEncoder.encode(password));
        userInsertParam.setName(name);
        userInsertParam.setEmail(email);
        userInsertParam.setPhone(phone);
        userInsertParam.setRole(UserRole.GUEST);
        userInsertParam.setStatus(UserStatus.ACTIVE);
        userInsertParam.setCreatedAt(now);
        userInsertParam.setUpdatedAt(now);

        try {
            userAccountCommandMapper.insertUser(userInsertParam);
        } catch (DuplicateKeyException duplicateKeyException) {
            throw new AppException(ErrorCode.DUPLICATE_LOGIN_ID, HttpStatus.CONFLICT);
        }
        userLoginSecurityMapper.insertIfAbsent(userInsertParam.getUserId());

        return new GuestSignupResult(
                userInsertParam.getUserId(),
                loginId,
                name,
                email,
                phone,
                UserRole.GUEST,
                UserStatus.ACTIVE,
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
