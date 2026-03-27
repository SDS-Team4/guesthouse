package com.guesthouse.shared.auth.service;

import com.guesthouse.shared.auth.api.FindIdRequest;
import com.guesthouse.shared.auth.api.FindIdVerifyRequest;
import com.guesthouse.shared.auth.api.FindIdVerifyResponse;
import com.guesthouse.shared.auth.api.RecoveryRequestResponse;
import com.guesthouse.shared.auth.api.ResetPasswordConfirmRequest;
import com.guesthouse.shared.auth.api.ResetPasswordConfirmResponse;
import com.guesthouse.shared.auth.api.ResetPasswordRequest;
import com.guesthouse.shared.auth.api.ResetPasswordVerifyRequest;
import com.guesthouse.shared.auth.api.ResetPasswordVerifyResponse;
import com.guesthouse.shared.db.auth.mapper.PasswordRecoveryVerificationMapper;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.auth.model.PasswordRecoveryVerificationInsertParam;
import com.guesthouse.shared.db.auth.model.PasswordRecoveryVerificationRecord;
import com.guesthouse.shared.db.auth.model.UserAuthRecord;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.auth.RecoveryChannel;
import com.guesthouse.shared.domain.auth.RecoveryVerificationStatus;
import com.guesthouse.shared.domain.auth.RecoveryVerificationType;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class AccountRecoveryService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");
    private static final int CODE_LENGTH = 6;
    private static final int MAX_ATTEMPTS = 5;
    private static final int VERIFICATION_TTL_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final UserQueryMapper userQueryMapper;
    private final UserAccountCommandMapper userAccountCommandMapper;
    private final UserLoginSecurityMapper userLoginSecurityMapper;
    private final PasswordRecoveryVerificationMapper passwordRecoveryVerificationMapper;
    private final RecoveryMessageDispatchService recoveryMessageDispatchService;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    public AccountRecoveryService(
            UserQueryMapper userQueryMapper,
            UserAccountCommandMapper userAccountCommandMapper,
            UserLoginSecurityMapper userLoginSecurityMapper,
            PasswordRecoveryVerificationMapper passwordRecoveryVerificationMapper,
            RecoveryMessageDispatchService recoveryMessageDispatchService,
            PasswordEncoder passwordEncoder,
            Clock clock
    ) {
        this.userQueryMapper = userQueryMapper;
        this.userAccountCommandMapper = userAccountCommandMapper;
        this.userLoginSecurityMapper = userLoginSecurityMapper;
        this.passwordRecoveryVerificationMapper = passwordRecoveryVerificationMapper;
        this.recoveryMessageDispatchService = recoveryMessageDispatchService;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional
    public RecoveryRequestResponse requestFindId(FindIdRequest request) {
        LocalDateTime now = LocalDateTime.now(clock);
        ContactMatch contactMatch = resolveFindIdUser(request.name(), request.email(), request.phone());
        if (contactMatch == null) {
            return new RecoveryRequestResponse(true);
        }

        issueVerificationIfCooldownAllows(contactMatch, RecoveryVerificationType.FIND_ID, now);
        return new RecoveryRequestResponse(true);
    }

    @Transactional
    public FindIdVerifyResponse verifyFindId(FindIdVerifyRequest request) {
        UserAuthRecord user = requireFindIdUser(request.name(), request.email(), request.phone());
        PasswordRecoveryVerificationRecord verification = requireLatestVerification(user.getUserId(), RecoveryVerificationType.FIND_ID);
        validateCodeOrThrow(verification, request.verificationCode(), false);
        passwordRecoveryVerificationMapper.markConsumed(verification.getVerificationId(), LocalDateTime.now(clock));
        return new FindIdVerifyResponse(true, user.getLoginId());
    }

    @Transactional
    public RecoveryRequestResponse requestPasswordReset(ResetPasswordRequest request) {
        LocalDateTime now = LocalDateTime.now(clock);
        ContactMatch contactMatch = resolveResetPasswordUser(request.loginId(), request.name(), request.email(), request.phone());
        if (contactMatch == null) {
            return new RecoveryRequestResponse(true);
        }

        issueVerificationIfCooldownAllows(contactMatch, RecoveryVerificationType.RESET_PASSWORD, now);
        return new RecoveryRequestResponse(true);
    }

    @Transactional
    public ResetPasswordVerifyResponse verifyPasswordReset(ResetPasswordVerifyRequest request) {
        UserAuthRecord user = requireResetPasswordUser(request.loginId(), request.name(), request.email(), request.phone());
        PasswordRecoveryVerificationRecord verification = requireLatestVerification(user.getUserId(), RecoveryVerificationType.RESET_PASSWORD);
        validateCodeOrThrow(verification, request.verificationCode(), true);
        if (verification.getStatus() == RecoveryVerificationStatus.PENDING) {
            passwordRecoveryVerificationMapper.markVerified(verification.getVerificationId());
        }
        return new ResetPasswordVerifyResponse(true);
    }

    @Transactional
    public ResetPasswordConfirmResponse confirmPasswordReset(ResetPasswordConfirmRequest request) {
        if (!request.newPassword().equals(request.newPasswordConfirm())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Password confirmation does not match.");
        }

        UserAuthRecord user = requireResetPasswordUser(request.loginId(), request.name(), request.email(), request.phone());
        PasswordRecoveryVerificationRecord verification = requireLatestVerification(user.getUserId(), RecoveryVerificationType.RESET_PASSWORD);
        validateCodeOrThrow(verification, request.verificationCode(), true);

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "New password must be different from the current password.");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        int updatedCount = userAccountCommandMapper.updateUserPasswordHash(
                user.getUserId(),
                passwordEncoder.encode(request.newPassword()),
                now
        );
        if (updatedCount != 1) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "User account not found.");
        }

        userLoginSecurityMapper.markPasswordChanged(user.getUserId(), now);
        userLoginSecurityMapper.clearFailureState(user.getUserId());
        passwordRecoveryVerificationMapper.markConsumed(verification.getVerificationId(), now);

        return new ResetPasswordConfirmResponse(true, now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime());
    }

    private void issueVerificationIfCooldownAllows(
            ContactMatch contactMatch,
            RecoveryVerificationType verificationType,
            LocalDateTime now
    ) {
        PasswordRecoveryVerificationRecord latest = requireFreshVerification(contactMatch.user().getUserId(), verificationType, now);
        if (latest != null && latest.getCreatedAt() != null
                && latest.getCreatedAt().isAfter(now.minusSeconds(RESEND_COOLDOWN_SECONDS))) {
            return;
        }

        passwordRecoveryVerificationMapper.expireActiveVerifications(
                contactMatch.user().getUserId(),
                verificationType,
                now.plusYears(100)
        );

        String verificationCode = generateVerificationCode();
        PasswordRecoveryVerificationInsertParam insertParam = new PasswordRecoveryVerificationInsertParam();
        insertParam.setUserId(contactMatch.user().getUserId());
        insertParam.setVerificationType(verificationType);
        insertParam.setChannel(contactMatch.channel());
        insertParam.setTokenHash(passwordEncoder.encode(verificationCode));
        insertParam.setExpiresAt(now.plusMinutes(VERIFICATION_TTL_MINUTES));
        insertParam.setCreatedAt(now);
        passwordRecoveryVerificationMapper.insertVerification(insertParam);

        recoveryMessageDispatchService.sendCode(
                verificationType,
                contactMatch.channel(),
                contactMatch.destination(),
                verificationCode
        );
    }

    private PasswordRecoveryVerificationRecord requireFreshVerification(
            Long userId,
            RecoveryVerificationType verificationType,
            LocalDateTime now
    ) {
        PasswordRecoveryVerificationRecord verification = passwordRecoveryVerificationMapper.findLatestActiveVerification(userId, verificationType);
        if (verification == null) {
            return null;
        }
        if (verification.getExpiresAt() != null && !verification.getExpiresAt().isAfter(now)) {
            passwordRecoveryVerificationMapper.markExpired(verification.getVerificationId());
            return null;
        }
        return verification;
    }

    private PasswordRecoveryVerificationRecord requireLatestVerification(Long userId, RecoveryVerificationType verificationType) {
        LocalDateTime now = LocalDateTime.now(clock);
        PasswordRecoveryVerificationRecord verification = passwordRecoveryVerificationMapper.findLatestActiveVerification(userId, verificationType);
        if (verification == null) {
            throw invalidVerification();
        }
        if (verification.getExpiresAt() == null || !verification.getExpiresAt().isAfter(now)) {
            passwordRecoveryVerificationMapper.markExpired(verification.getVerificationId());
            throw invalidVerification();
        }
        if (verification.getAttemptCount() != null && verification.getAttemptCount() >= MAX_ATTEMPTS) {
            passwordRecoveryVerificationMapper.markExpired(verification.getVerificationId());
            throw invalidVerification();
        }
        return verification;
    }

    private void validateCodeOrThrow(
            PasswordRecoveryVerificationRecord verification,
            String verificationCode,
            boolean allowVerifiedState
    ) {
        if (!allowVerifiedState && verification.getStatus() != RecoveryVerificationStatus.PENDING) {
            throw invalidVerification();
        }
        if (allowVerifiedState
                && verification.getStatus() != RecoveryVerificationStatus.PENDING
                && verification.getStatus() != RecoveryVerificationStatus.VERIFIED) {
            throw invalidVerification();
        }

        if (verificationCode == null || !verificationCode.matches("\\d{6}")) {
            incrementAttemptAndThrow(verification);
        }

        if (!passwordEncoder.matches(verificationCode, verification.getTokenHash())) {
            incrementAttemptAndThrow(verification);
        }
    }

    private void incrementAttemptAndThrow(PasswordRecoveryVerificationRecord verification) {
        passwordRecoveryVerificationMapper.incrementAttemptCount(verification.getVerificationId());
        int currentAttempts = verification.getAttemptCount() == null ? 0 : verification.getAttemptCount();
        if (currentAttempts + 1 >= MAX_ATTEMPTS) {
            passwordRecoveryVerificationMapper.markExpired(verification.getVerificationId());
        }
        throw invalidVerification();
    }

    private UserAuthRecord requireFindIdUser(String name, String email, String phone) {
        ContactMatch contactMatch = resolveFindIdUser(name, email, phone);
        if (contactMatch == null) {
            throw invalidVerification();
        }
        return contactMatch.user();
    }

    private UserAuthRecord requireResetPasswordUser(String loginId, String name, String email, String phone) {
        ContactMatch contactMatch = resolveResetPasswordUser(loginId, name, email, phone);
        if (contactMatch == null) {
            throw invalidVerification();
        }
        return contactMatch.user();
    }

    private ContactMatch resolveFindIdUser(String name, String email, String phone) {
        ContactInfo contactInfo = resolveContact(email, phone);
        if (contactInfo == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Either email or phone must be provided.");
        }

        UserAuthRecord user = contactInfo.channel() == RecoveryChannel.EMAIL
                ? userQueryMapper.findActiveUserByNameAndEmail(normalizeRequired(name), contactInfo.destination())
                : userQueryMapper.findActiveUserByNameAndPhone(normalizeRequired(name), contactInfo.destination());
        return user == null ? null : new ContactMatch(user, contactInfo.channel(), contactInfo.destination());
    }

    private ContactMatch resolveResetPasswordUser(String loginId, String name, String email, String phone) {
        ContactInfo contactInfo = resolveContact(email, phone);
        if (contactInfo == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Either email or phone must be provided.");
        }

        String normalizedLoginId = normalizeRequired(loginId);
        String normalizedName = normalizeRequired(name);
        UserAuthRecord user = contactInfo.channel() == RecoveryChannel.EMAIL
                ? userQueryMapper.findActiveUserByLoginIdAndNameAndEmail(normalizedLoginId, normalizedName, contactInfo.destination())
                : userQueryMapper.findActiveUserByLoginIdAndNameAndPhone(normalizedLoginId, normalizedName, contactInfo.destination());
        return user == null ? null : new ContactMatch(user, contactInfo.channel(), contactInfo.destination());
    }

    private ContactInfo resolveContact(String email, String phone) {
        String normalizedEmail = normalizeOptional(email);
        String normalizedPhone = normalizeOptional(phone);
        if ((normalizedEmail == null && normalizedPhone == null) || (normalizedEmail != null && normalizedPhone != null)) {
            return null;
        }
        if (normalizedEmail != null) {
            return new ContactInfo(RecoveryChannel.EMAIL, normalizedEmail);
        }
        return new ContactInfo(RecoveryChannel.SMS, normalizedPhone);
    }

    private String generateVerificationCode() {
        int value = secureRandom.nextInt(1_000_000);
        return String.format("%06d", value);
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Required recovery information is missing.");
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

    private AppException invalidVerification() {
        return new AppException(
                ErrorCode.INVALID_REQUEST,
                HttpStatus.BAD_REQUEST,
                "Verification code is invalid or expired."
        );
    }

    private record ContactInfo(
            RecoveryChannel channel,
            String destination
    ) {
    }

    private record ContactMatch(
            UserAuthRecord user,
            RecoveryChannel channel,
            String destination
    ) {
    }
}
