package com.guesthouse.guestapi.account;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.guestapi.account.api.ChangeGuestPasswordRequest;
import com.guesthouse.guestapi.account.api.CreateHostRoleRequestRequest;
import com.guesthouse.guestapi.account.api.UpdateGuestAccountProfileRequest;
import com.guesthouse.guestapi.account.service.GuestAccountProfileService;
import com.guesthouse.guestapi.account.service.GuestAccountProfileView;
import com.guesthouse.guestapi.account.service.GuestHostRoleRequestService;
import com.guesthouse.guestapi.account.service.GuestHostRoleRequestStateView;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
import com.guesthouse.shared.auth.service.AccountRecoveryService;
import com.guesthouse.shared.auth.session.SessionLifecycleService;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.auth.mapper.PasswordRecoveryVerificationMapper;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.domain.user.HostRoleRequestStatus;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.web.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = GuestAccountController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class GuestAccountControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GuestAccountProfileService guestAccountProfileService;

    @MockBean
    private GuestHostRoleRequestService guestHostRoleRequestService;

    @MockBean
    private AccountRecoveryService accountRecoveryService;

    @MockBean
    private SessionLifecycleService sessionLifecycleService;

    @MockBean
    private UserQueryMapper userQueryMapper;

    @MockBean
    private UserLoginSecurityMapper userLoginSecurityMapper;

    @MockBean
    private PasswordRecoveryVerificationMapper passwordRecoveryVerificationMapper;

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
    void getHostRoleRequestStateReturnsCurrentState() throws Exception {
        when(guestHostRoleRequestService.getRequestState(101L))
                .thenReturn(new GuestHostRoleRequestStateView(UserRole.GUEST, true, null, null));

        mockMvc.perform(
                        get("/api/v1/account/host-role-request")
                                .session(guestSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentUserRole").value("GUEST"))
                .andExpect(jsonPath("$.data.canSubmitNewRequest").value(true));
    }

    @Test
    void getProfileReturnsCurrentGuestProfile() throws Exception {
        when(guestAccountProfileService.getProfile(101L))
                .thenReturn(new GuestAccountProfileView(
                        101L,
                        "guest.demo",
                        "Guest Demo",
                        "guest@example.com",
                        "010-1111-2222",
                        UserRole.GUEST,
                        com.guesthouse.shared.domain.user.UserStatus.ACTIVE
                ));

        mockMvc.perform(
                        get("/api/v1/account/me")
                                .session(guestSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loginId").value("guest.demo"))
                .andExpect(jsonPath("$.data.email").value("guest@example.com"));
    }

    @Test
    void updateProfileReturnsUpdatedProfile() throws Exception {
        when(guestAccountProfileService.updateProfile(eq(101L), any(UpdateGuestAccountProfileRequest.class)))
                .thenReturn(new GuestAccountProfileView(
                        101L,
                        "guest.demo",
                        "Updated Guest",
                        "updated@example.com",
                        "010-9999-0000",
                        UserRole.GUEST,
                        com.guesthouse.shared.domain.user.UserStatus.ACTIVE
                ));

        mockMvc.perform(
                        patch("/api/v1/account/me")
                                .session(guestSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                        new UpdateGuestAccountProfileRequest(
                                                "Updated Guest",
                                                "updated@example.com",
                                                "010-9999-0000"
                                        )
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Guest"))
                .andExpect(jsonPath("$.data.email").value("updated@example.com"));
    }

    @Test
    void changePasswordReturnsChangedTimestamp() throws Exception {
        when(guestAccountProfileService.changePassword(eq(101L), any(ChangeGuestPasswordRequest.class)))
                .thenReturn(new com.guesthouse.guestapi.account.api.GuestAccountPasswordChangeResponse(
                        true,
                        java.time.OffsetDateTime.parse("2026-03-25T12:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/account/password")
                                .session(guestSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                        new ChangeGuestPasswordRequest(
                                                "guestpass123!",
                                                "newguestpass123!",
                                                "newguestpass123!"
                                        )
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.changed").value(true));
    }

    @Test
    void createHostRoleRequestReturnsPendingState() throws Exception {
        com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord record =
                new com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord();
        record.setRequestId(401L);
        record.setRequestReason("Need host access.");
        record.setStatus(HostRoleRequestStatus.PENDING);

        when(guestHostRoleRequestService.createRequest(any(SessionUser.class), eq("Need host access.")))
                .thenReturn(new GuestHostRoleRequestStateView(UserRole.GUEST, false, "Pending review.", record));

        mockMvc.perform(
                        post("/api/v1/account/host-role-request")
                                .session(guestSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                        new CreateHostRoleRequestRequest("Need host access.")
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.canSubmitNewRequest").value(false))
                .andExpect(jsonPath("$.data.latestRequest.requestId").value(401))
                .andExpect(jsonPath("$.data.latestRequest.status").value("PENDING"));
    }

    @Test
    void hostRoleRequestRejectsGuestlessSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST));

        mockMvc.perform(
                        get("/api/v1/account/host-role-request")
                                .session(session)
                )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    private MockHttpSession guestSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));
        return session;
    }
}
