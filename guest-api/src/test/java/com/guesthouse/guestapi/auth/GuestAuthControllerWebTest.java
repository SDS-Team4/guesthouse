package com.guesthouse.guestapi.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.guestapi.auth.api.SignupRequest;
import com.guesthouse.guestapi.auth.api.SignupFieldAvailabilityResponse;
import com.guesthouse.guestapi.auth.service.GuestSignupResult;
import com.guesthouse.guestapi.auth.service.GuestSignupService;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
import com.guesthouse.shared.auth.service.SessionAuthenticationService;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.user.UserStatus;
import com.guesthouse.shared.domain.web.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = GuestAuthController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class GuestAuthControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SessionAuthenticationService sessionAuthenticationService;

    @MockBean
    private GuestSignupService guestSignupService;

    @MockBean
    private UserQueryMapper userQueryMapper;

    @MockBean
    private UserLoginSecurityMapper userLoginSecurityMapper;

    @MockBean
    private ReservationInventoryMapper reservationInventoryMapper;

    @MockBean
    private ReservationCommandMapper reservationCommandMapper;

    @MockBean
    private ReservationQueryMapper reservationQueryMapper;

    @MockBean
    private AuditLogMapper auditLogMapper;

    @MockBean
    private RoomBlockQueryMapper roomBlockQueryMapper;

    @MockBean
    private RoomBlockCommandMapper roomBlockCommandMapper;

    @MockBean
    private PricePolicyQueryMapper pricePolicyQueryMapper;

    @MockBean
    private PricePolicyCommandMapper pricePolicyCommandMapper;

    @MockBean
    private UserAccountQueryMapper userAccountQueryMapper;

    @MockBean
    private UserAccountCommandMapper userAccountCommandMapper;

    @MockBean
    private TermQueryMapper termQueryMapper;

    @MockBean
    private UserTermAgreementCommandMapper userTermAgreementCommandMapper;

    @MockBean
    private HostRoleRequestQueryMapper hostRoleRequestQueryMapper;

    @MockBean
    private HostRoleRequestCommandMapper hostRoleRequestCommandMapper;

    @Test
    void loginCreatesSessionAndMeReflectsAuthenticatedGuest() throws Exception {
        when(sessionAuthenticationService.authenticate(any(), any()))
                .thenReturn(new SessionUser(101L, "guest-demo", "Guest Demo", UserRole.GUEST));

        MockHttpSession session = (MockHttpSession) mockMvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new LoginPayload("guest-demo", "guestpass")))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(101))
                .andExpect(jsonPath("$.data.role").value("GUEST"))
                .andReturn()
                .getRequest()
                .getSession(false);

        mockMvc.perform(
                        get("/api/v1/auth/me")
                                .session(session)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loginId").value("guest-demo"))
                .andExpect(jsonPath("$.data.role").value("GUEST"));
    }

    @Test
    void logoutInvalidatesSessionAndSubsequentMeIsUnauthorized() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest-demo", "Guest Demo", UserRole.GUEST));
        session.setAttribute("SESSION_CSRF_TOKEN", "csrf-token");

        mockMvc.perform(
                        post("/api/v1/auth/logout")
                                .header("X-CSRF-Token", "csrf-token")
                                .session(session)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loggedOut").value(true));

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void meWithoutSessionReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void signupReturnsCreatedGuestSummary() throws Exception {
        when(guestSignupService.signup(any(SignupRequest.class)))
                .thenReturn(new GuestSignupResult(
                        104L,
                        "new.guest",
                        "New Guest",
                        "new.guest@example.com",
                        "010-1234-5678",
                        UserRole.GUEST,
                        UserStatus.ACTIVE,
                        OffsetDateTime.parse("2026-03-25T10:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/auth/signup")
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SignupRequest(
                                        "new.guest",
                                        "guestpass123!",
                                        "guestpass123!",
                                        "New Guest",
                                        "new.guest@example.com",
                                        "010-1234-5678",
                                        java.util.List.of(1301L, 1302L)
                                )))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.registered").value(true));
    }

    @Test
    void signupLoginIdAvailabilityReturnsAvailableState() throws Exception {
        when(guestSignupService.isLoginIdAvailable("guest-ready")).thenReturn(true);

        mockMvc.perform(get("/api/v1/auth/signup-login-id-availability").param("loginId", "guest-ready"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loginId").value("guest-ready"))
                .andExpect(jsonPath("$.data.available").value(true));
    }

    @Test
    void signupFieldAvailabilityReturnsAllDuplicateStatesTogether() throws Exception {
        when(guestSignupService.checkSignupFieldAvailability("guest-ready", "guest@example.com", "01012345678"))
                .thenReturn(new SignupFieldAvailabilityResponse(
                        "guest-ready",
                        false,
                        "guest@example.com",
                        false,
                        "01012345678",
                        true
                ));

        mockMvc.perform(
                        get("/api/v1/auth/signup-field-availability")
                                .param("loginId", "guest-ready")
                                .param("email", "guest@example.com")
                                .param("phone", "01012345678")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loginIdAvailable").value(false))
                .andExpect(jsonPath("$.data.emailAvailable").value(false))
                .andExpect(jsonPath("$.data.phoneAvailable").value(true));
    }

    private record LoginPayload(String loginId, String password) {
    }
}
