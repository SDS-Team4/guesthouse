package com.guesthouse.guestapi.auth.service;

import com.guesthouse.guestapi.auth.api.SignupRequest;
import com.guesthouse.guestapi.auth.api.SignupFieldAvailabilityResponse;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.term.model.PublishedRequiredTermRecord;
import com.guesthouse.shared.db.term.model.UserTermAgreementInsertParam;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class GuestSignupService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final UserAccountQueryMapper userAccountQueryMapper;
    private final UserAccountCommandMapper userAccountCommandMapper;
    private final UserLoginSecurityMapper userLoginSecurityMapper;
    private final TermQueryMapper termQueryMapper;
    private final UserTermAgreementCommandMapper userTermAgreementCommandMapper;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public GuestSignupService(
            UserAccountQueryMapper userAccountQueryMapper,
            UserAccountCommandMapper userAccountCommandMapper,
            UserLoginSecurityMapper userLoginSecurityMapper,
            TermQueryMapper termQueryMapper,
            UserTermAgreementCommandMapper userTermAgreementCommandMapper,
            PasswordEncoder passwordEncoder,
            Clock clock
    ) {
        this.userAccountQueryMapper = userAccountQueryMapper;
        this.userAccountCommandMapper = userAccountCommandMapper;
        this.userLoginSecurityMapper = userLoginSecurityMapper;
        this.termQueryMapper = termQueryMapper;
        this.userTermAgreementCommandMapper = userTermAgreementCommandMapper;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    public List<PublishedRequiredTermRecord> findPublishedRequiredTerms() {
        return termQueryMapper.findPublishedRequiredTerms();
    }

    public boolean isLoginIdAvailable(String loginId) {
        String normalizedLoginId = normalizeRequired(loginId, "Login ID is required.");
        if (normalizedLoginId.length() < 4 || normalizedLoginId.length() > 50) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "Login ID must be between 4 and 50 characters."
            );
        }
        return userAccountQueryMapper.findUserIdByLoginId(normalizedLoginId) == null;
    }

    public SignupFieldAvailabilityResponse checkSignupFieldAvailability(
            String loginId,
            String email,
            String phone
    ) {
        String normalizedLoginId = normalizeOptional(loginId);
        String normalizedEmail = normalizeOptional(email);
        String normalizedPhone = normalizeOptional(phone);

        return new SignupFieldAvailabilityResponse(
                normalizedLoginId,
                normalizedLoginId == null ? null : userAccountQueryMapper.findUserIdByLoginId(normalizedLoginId) == null,
                normalizedEmail,
                normalizedEmail == null ? null : userAccountQueryMapper.findUserIdByEmail(normalizedEmail) == null,
                normalizedPhone,
                normalizedPhone == null ? null : userAccountQueryMapper.findUserIdByPhone(normalizedPhone) == null
        );
    }

    @Transactional
    public GuestSignupResult signup(SignupRequest request) {
        String loginId = normalizeRequired(request.loginId(), "Login ID is required.");
        String password = request.password();
        String passwordConfirm = request.passwordConfirm();
        String name = normalizeRequired(request.name(), "Name is required.");
        String email = normalizeRequired(request.email(), "Email is required.");
        String phone = normalizeRequired(request.phone(), "Phone number is required.");
        List<PublishedRequiredTermRecord> requiredTerms = termQueryMapper.findPublishedRequiredTerms();

        if (!password.equals(passwordConfirm)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.BAD_REQUEST, "Password confirmation does not match.");
        }
        validateRequiredTermsAgreement(requiredTerms, request.agreedTermIds());

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
        userTermAgreementCommandMapper.insertUserTermAgreements(
                buildAgreementInsertParams(userInsertParam.getUserId(), requiredTerms, now)
        );

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

    private void validateRequiredTermsAgreement(
            List<PublishedRequiredTermRecord> requiredTerms,
            List<Long> agreedTermIds
    ) {
        Set<Long> agreedIds = agreedTermIds == null ? Set.of() : new LinkedHashSet<>(agreedTermIds);
        for (PublishedRequiredTermRecord requiredTerm : requiredTerms) {
            if (!agreedIds.contains(requiredTerm.getTermId())) {
                throw new AppException(
                        ErrorCode.INVALID_REQUEST,
                        HttpStatus.BAD_REQUEST,
                        "All required terms must be agreed before signup."
                );
            }
        }
    }

    private List<UserTermAgreementInsertParam> buildAgreementInsertParams(
            Long userId,
            List<PublishedRequiredTermRecord> requiredTerms,
            LocalDateTime now
    ) {
        return requiredTerms.stream()
                .map(requiredTerm -> {
                    UserTermAgreementInsertParam insertParam = new UserTermAgreementInsertParam();
                    insertParam.setUserId(userId);
                    insertParam.setTermId(requiredTerm.getTermId());
                    insertParam.setAgreedAt(now);
                    insertParam.setTermVersionSnapshot(requiredTerm.getVersion());
                    return insertParam;
                })
                .toList();
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
