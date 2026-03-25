package com.guesthouse.guestapi.account.service;

import com.guesthouse.guestapi.account.api.ChangeGuestPasswordRequest;
import com.guesthouse.guestapi.account.api.GuestAccountPasswordChangeResponse;
import com.guesthouse.guestapi.account.api.UpdateGuestAccountProfileRequest;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.db.user.model.UserAccountRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class GuestAccountProfileService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final UserAccountQueryMapper userAccountQueryMapper;
    private final UserAccountCommandMapper userAccountCommandMapper;
    private final UserQueryMapper userQueryMapper;
    private final UserLoginSecurityMapper userLoginSecurityMapper;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public GuestAccountProfileService(
            UserAccountQueryMapper userAccountQueryMapper,
            UserAccountCommandMapper userAccountCommandMapper,
            UserQueryMapper userQueryMapper,
            UserLoginSecurityMapper userLoginSecurityMapper,
            PasswordEncoder passwordEncoder,
            Clock clock
    ) {
        this.userAccountQueryMapper = userAccountQueryMapper;
        this.userAccountCommandMapper = userAccountCommandMapper;
        this.userQueryMapper = userQueryMapper;
        this.userLoginSecurityMapper = userLoginSecurityMapper;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    public GuestAccountProfileView getProfile(Long userId) {
        UserAccountRecord userAccountRecord = userAccountQueryMapper.findUserAccountByUserId(userId);
        if (userAccountRecord == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "User account not found.");
        }
        return toView(userAccountRecord);
    }

    @Transactional
    public GuestAccountProfileView updateProfile(Long userId, UpdateGuestAccountProfileRequest request) {
        String name = normalizeRequired(request.name(), "Name is required.");
        String email = normalizeOptional(request.email());
        String phone = normalizeOptional(request.phone());

        requireUniqueContact(userId, email, phone);

        int updatedCount = userAccountCommandMapper.updateUserProfile(
                userId,
                name,
                email,
                phone,
                LocalDateTime.now(clock)
        );
        if (updatedCount != 1) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "User account not found.");
        }
        return getProfile(userId);
    }

    @Transactional
    public GuestAccountPasswordChangeResponse changePassword(Long userId, ChangeGuestPasswordRequest request) {
        if (!request.newPassword().equals(request.newPasswordConfirm())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Password confirmation does not match.");
        }

        UserAuthRecord userAuthRecord = userQueryMapper.findAuthUserByUserId(userId);
        if (userAuthRecord == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "User account not found.");
        }
        if (!passwordEncoder.matches(request.currentPassword(), userAuthRecord.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }
        if (passwordEncoder.matches(request.newPassword(), userAuthRecord.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "New password must be different from the current password.");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        int updatedCount = userAccountCommandMapper.updateUserPasswordHash(
                userId,
                passwordEncoder.encode(request.newPassword()),
                now
        );
        if (updatedCount != 1) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "User account not found.");
        }
        userLoginSecurityMapper.markPasswordChanged(userId, now);
        return new GuestAccountPasswordChangeResponse(true, now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    private GuestAccountProfileView toView(UserAccountRecord userAccountRecord) {
        return new GuestAccountProfileView(
                userAccountRecord.getUserId(),
                userAccountRecord.getLoginId(),
                userAccountRecord.getName(),
                userAccountRecord.getEmail(),
                userAccountRecord.getPhone(),
                userAccountRecord.getRole(),
                userAccountRecord.getStatus()
        );
    }

    private void requireUniqueContact(Long userId, String email, String phone) {
        Long existingEmailUserId = email == null ? null : userAccountQueryMapper.findUserIdByEmail(email);
        if (existingEmailUserId != null && !existingEmailUserId.equals(userId)) {
            throw new AppException(ErrorCode.DUPLICATE_EMAIL, HttpStatus.CONFLICT);
        }

        Long existingPhoneUserId = phone == null ? null : userAccountQueryMapper.findUserIdByPhone(phone);
        if (existingPhoneUserId != null && !existingPhoneUserId.equals(userId)) {
            throw new AppException(ErrorCode.DUPLICATE_PHONE, HttpStatus.CONFLICT);
        }
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
