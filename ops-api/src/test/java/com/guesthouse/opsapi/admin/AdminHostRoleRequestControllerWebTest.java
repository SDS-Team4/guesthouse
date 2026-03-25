package com.guesthouse.opsapi.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.opsapi.admin.api.AdminHostRoleRequestDecisionRequest;
import com.guesthouse.opsapi.admin.service.AdminHostRoleRequestCommandService;
import com.guesthouse.opsapi.admin.service.AdminHostRoleRequestMutationResult;
import com.guesthouse.opsapi.admin.service.AdminHostRoleRequestQueryService;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.hostrole.model.HostRoleRequestRecord;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminHostRoleRequestController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class AdminHostRoleRequestControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminHostRoleRequestQueryService adminHostRoleRequestQueryService;

    @MockBean
    private AdminHostRoleRequestCommandService adminHostRoleRequestCommandService;

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
    void hostRoleRequestListReturnsPayload() throws Exception {
        HostRoleRequestRecord record = new HostRoleRequestRecord();
        record.setRequestId(401L);
        record.setUserId(101L);
        record.setUserLoginId("guest.demo");
        record.setUserName("Guest Demo");
        record.setUserRole(UserRole.GUEST);
        record.setUserStatus(UserStatus.ACTIVE);
        record.setRequestReason("Need host access");
        record.setStatus(HostRoleRequestStatus.PENDING);

        when(adminHostRoleRequestQueryService.findRequests("PENDING")).thenReturn(List.of(record));

        mockMvc.perform(
                        get("/api/v1/admin/host-role-requests")
                                .param("status", "PENDING")
                                .session(adminSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].requestId").value(401))
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
    }

    @Test
    void approveRequestReturnsMutationResult() throws Exception {
        when(adminHostRoleRequestCommandService.approveRequest(eq(401L), any(SessionUser.class), eq("Looks good")))
                .thenReturn(new AdminHostRoleRequestMutationResult(
                        401L,
                        101L,
                        HostRoleRequestStatus.APPROVED,
                        UserRole.HOST,
                        "Looks good",
                        OffsetDateTime.parse("2026-03-25T10:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/admin/host-role-requests/401/approve")
                                .session(adminSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                        new AdminHostRoleRequestDecisionRequest("Looks good")
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.userRole").value("HOST"));
    }

    @Test
    void rejectsHostSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST));

        mockMvc.perform(get("/api/v1/admin/host-role-requests").session(session))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    private MockHttpSession adminSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(103L, "admin.demo", "Admin Demo", UserRole.ADMIN));
        return session;
    }
}
