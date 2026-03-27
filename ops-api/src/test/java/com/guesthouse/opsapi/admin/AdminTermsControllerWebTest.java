package com.guesthouse.opsapi.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.opsapi.admin.api.AdminTermDraftCreateRequest;
import com.guesthouse.opsapi.admin.api.AdminTermUpdateRequest;
import com.guesthouse.opsapi.admin.service.AdminTermCommandService;
import com.guesthouse.opsapi.admin.service.AdminTermMutationResult;
import com.guesthouse.opsapi.admin.service.AdminTermQueryService;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetCommandMapper;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetQueryMapper;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
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
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.term.mapper.TermCommandMapper;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.term.model.AdminTermDetailRecord;
import com.guesthouse.shared.db.term.model.AdminTermListRecord;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.web.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminTermsController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class AdminTermsControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminTermQueryService adminTermQueryService;

    @MockBean
    private AdminTermCommandService adminTermCommandService;

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
    private TermCommandMapper termCommandMapper;

    @MockBean
    private UserTermAgreementCommandMapper userTermAgreementCommandMapper;

    @MockBean
    private HostRoleRequestQueryMapper hostRoleRequestQueryMapper;

    @MockBean
    private HostRoleRequestCommandMapper hostRoleRequestCommandMapper;

    @MockBean
    private HostAssetQueryMapper hostAssetQueryMapper;

    @MockBean
    private HostAssetCommandMapper hostAssetCommandMapper;

    @Test
    void termListReturnsPayload() throws Exception {
        AdminTermListRecord record = new AdminTermListRecord();
        record.setTermId(1301L);
        record.setCategory("SERVICE");
        record.setTitle("서비스 이용약관");
        record.setVersion("1.0");
        record.setRequired(true);
        record.setStatus("PUBLISHED");
        record.setEffectiveAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        record.setUpdatedAt(LocalDateTime.of(2026, 3, 1, 0, 0));

        when(adminTermQueryService.findTerms()).thenReturn(List.of(record));

        mockMvc.perform(get("/api/v1/admin/terms").session(adminSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].category").value("SERVICE"))
                .andExpect(jsonPath("$.data[0].status").value("PUBLISHED"));
    }

    @Test
    void termDetailReturnsPayload() throws Exception {
        AdminTermDetailRecord record = new AdminTermDetailRecord();
        record.setTermId(1301L);
        record.setCategory("SERVICE");
        record.setTitle("서비스 이용약관");
        record.setContent("본문");
        record.setVersion("1.0");
        record.setRequired(true);
        record.setStatus("PUBLISHED");
        record.setEffectiveAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        record.setCreatedAt(LocalDateTime.of(2026, 3, 1, 0, 0));
        record.setUpdatedAt(LocalDateTime.of(2026, 3, 1, 0, 0));

        when(adminTermQueryService.getTermDetail(1301L)).thenReturn(record);

        mockMvc.perform(get("/api/v1/admin/terms/1301").session(adminSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("서비스 이용약관"))
                .andExpect(jsonPath("$.data.content").value("본문"));
    }

    @Test
    void createDraftReturnsMutationResult() throws Exception {
        when(adminTermCommandService.createDraft(eq(1301L), any(AdminTermDraftCreateRequest.class), any(SessionUser.class)))
                .thenReturn(new AdminTermMutationResult(
                        1401L,
                        "SERVICE",
                        "서비스 이용약관",
                        "본문",
                        "1.1",
                        true,
                        "DRAFT",
                        OffsetDateTime.parse("2026-03-27T00:00:00+09:00"),
                        OffsetDateTime.parse("2026-03-27T10:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/admin/terms/1301/drafts")
                                .session(adminSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new AdminTermDraftCreateRequest("1.1")))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.termId").value(1401))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));
    }

    @Test
    void updateDraftRejectsHostSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST));

        mockMvc.perform(
                        put("/api/v1/admin/terms/1301")
                                .session(session)
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                        new AdminTermUpdateRequest(
                                                "서비스 이용약관",
                                                "본문",
                                                "1.1",
                                                true,
                                                LocalDateTime.of(2026, 3, 27, 0, 0)
                                        )
                                ))
                )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void publishReturnsMutationResult() throws Exception {
        when(adminTermCommandService.publishTerm(eq(1401L), any(SessionUser.class)))
                .thenReturn(new AdminTermMutationResult(
                        1401L,
                        "SERVICE",
                        "서비스 이용약관",
                        "본문",
                        "1.1",
                        true,
                        "PUBLISHED",
                        OffsetDateTime.parse("2026-03-27T00:00:00+09:00"),
                        OffsetDateTime.parse("2026-03-27T10:05:00+09:00")
                ));

        mockMvc.perform(post("/api/v1/admin/terms/1401/publish").session(adminSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.data.version").value("1.1"));
    }

    private MockHttpSession adminSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(103L, "admin.demo", "Admin Demo", UserRole.ADMIN));
        return session;
    }
}
