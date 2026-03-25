package com.guesthouse.guestapi.account;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.guestapi.account.api.CreateHostRoleRequestRequest;
import com.guesthouse.guestapi.account.service.GuestHostRoleRequestService;
import com.guesthouse.guestapi.account.service.GuestHostRoleRequestStateView;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
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
    private GuestHostRoleRequestService guestHostRoleRequestService;

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
