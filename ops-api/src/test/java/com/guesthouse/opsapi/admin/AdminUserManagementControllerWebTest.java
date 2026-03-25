package com.guesthouse.opsapi.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.opsapi.admin.service.AdminUserQueryService;
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
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.db.user.model.AdminUserDetailRecord;
import com.guesthouse.shared.db.user.model.AdminUserListRecord;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminUserManagementController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class AdminUserManagementControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminUserQueryService adminUserQueryService;

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
    void usersReturnsAdminList() throws Exception {
        AdminUserListRecord record = new AdminUserListRecord();
        record.setUserId(101L);
        record.setLoginId("guest.demo");
        record.setName("Guest Demo");
        record.setRole(UserRole.GUEST);
        record.setStatus(UserStatus.ACTIVE);
        record.setCreatedAt(LocalDateTime.of(2026, 3, 20, 9, 0));
        record.setFailedLoginCount(0);

        when(adminUserQueryService.findUsers()).thenReturn(List.of(record));

        mockMvc.perform(get("/api/v1/admin/users").session(adminSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].loginId").value("guest.demo"))
                .andExpect(jsonPath("$.data[0].role").value("GUEST"));
    }

    @Test
    void userDetailRejectsHostSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST));

        mockMvc.perform(get("/api/v1/admin/users/101").session(session))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void userDetailReturnsPayload() throws Exception {
        AdminUserDetailRecord record = new AdminUserDetailRecord();
        record.setUserId(101L);
        record.setLoginId("guest.demo");
        record.setName("Guest Demo");
        record.setRole(UserRole.GUEST);
        record.setStatus(UserStatus.ACTIVE);
        record.setCreatedAt(LocalDateTime.of(2026, 3, 20, 9, 0));
        record.setUpdatedAt(LocalDateTime.of(2026, 3, 25, 10, 0));
        record.setFailedLoginCount(0);

        when(adminUserQueryService.getUserDetail(101L)).thenReturn(record);

        mockMvc.perform(get("/api/v1/admin/users/101").session(adminSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loginId").value("guest.demo"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    private MockHttpSession adminSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(103L, "admin.demo", "Admin Demo", UserRole.ADMIN));
        return session;
    }
}
