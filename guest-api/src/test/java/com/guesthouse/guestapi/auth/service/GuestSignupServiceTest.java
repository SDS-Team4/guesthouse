package com.guesthouse.guestapi.auth.service;

import com.guesthouse.guestapi.auth.api.SignupRequest;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.term.model.PublishedRequiredTermRecord;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.db.user.model.UserInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestSignupServiceTest {

    @Mock
    private UserAccountQueryMapper userAccountQueryMapper;

    @Mock
    private UserAccountCommandMapper userAccountCommandMapper;

    @Mock
    private UserLoginSecurityMapper userLoginSecurityMapper;

    @Mock
    private TermQueryMapper termQueryMapper;

    @Mock
    private UserTermAgreementCommandMapper userTermAgreementCommandMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    private GuestSignupService guestSignupService;

    @BeforeEach
    void setUp() {
        guestSignupService = new GuestSignupService(
                userAccountQueryMapper,
                userAccountCommandMapper,
                userLoginSecurityMapper,
                termQueryMapper,
                userTermAgreementCommandMapper,
                passwordEncoder,
                Clock.fixed(Instant.parse("2026-03-25T01:00:00Z"), ZoneId.of("Asia/Seoul"))
        );
    }

    @Test
    void signupCreatesGuestUserAndSecurityRow() {
        when(userAccountQueryMapper.findUserIdByLoginId("new.guest")).thenReturn(null);
        when(userAccountQueryMapper.findUserIdByEmail("new.guest@example.com")).thenReturn(null);
        when(userAccountQueryMapper.findUserIdByPhone("010-1234-5678")).thenReturn(null);
        when(termQueryMapper.findPublishedRequiredTerms()).thenReturn(List.of(requiredServiceTerm(), requiredPrivacyTerm()));
        when(passwordEncoder.encode("guestpass123!")).thenReturn("hashed-password");
        doAnswer(invocation -> {
            UserInsertParam userInsertParam = invocation.getArgument(0);
            userInsertParam.setUserId(104L);
            return null;
        }).when(userAccountCommandMapper).insertUser(any(UserInsertParam.class));

        GuestSignupResult result = guestSignupService.signup(new SignupRequest(
                "new.guest",
                "guestpass123!",
                "guestpass123!",
                "New Guest",
                "new.guest@example.com",
                "010-1234-5678",
                List.of(1301L, 1302L)
        ));

        assertEquals(104L, result.userId());
        assertEquals("new.guest", result.loginId());
        verify(userAccountCommandMapper).insertUser(any(UserInsertParam.class));
        verify(userLoginSecurityMapper).insertIfAbsent(104L);
        verify(userTermAgreementCommandMapper).insertUserTermAgreements(any());
    }

    @Test
    void signupRejectsDuplicateEmail() {
        when(userAccountQueryMapper.findUserIdByLoginId("new.guest")).thenReturn(null);
        when(termQueryMapper.findPublishedRequiredTerms()).thenReturn(List.of(requiredServiceTerm(), requiredPrivacyTerm()));
        when(userAccountQueryMapper.findUserIdByEmail("dup@example.com")).thenReturn(201L);

        AppException exception = assertThrows(
                AppException.class,
                () -> guestSignupService.signup(new SignupRequest(
                        "new.guest",
                        "guestpass123!",
                        "guestpass123!",
                        "New Guest",
                        "dup@example.com",
                        "010-1234-5678",
                        List.of(1301L, 1302L)
                ))
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.DUPLICATE_EMAIL, exception.getErrorCode());
        verify(userAccountCommandMapper, never()).insertUser(any(UserInsertParam.class));
    }

    private PublishedRequiredTermRecord requiredServiceTerm() {
        PublishedRequiredTermRecord record = new PublishedRequiredTermRecord();
        record.setTermId(1301L);
        record.setCategory("SERVICE");
        record.setTitle("Service");
        record.setVersion("1.0");
        record.setEffectiveAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        return record;
    }

    private PublishedRequiredTermRecord requiredPrivacyTerm() {
        PublishedRequiredTermRecord record = new PublishedRequiredTermRecord();
        record.setTermId(1302L);
        record.setCategory("PRIVACY");
        record.setTitle("Privacy");
        record.setVersion("1.0");
        record.setEffectiveAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        return record;
    }
}
