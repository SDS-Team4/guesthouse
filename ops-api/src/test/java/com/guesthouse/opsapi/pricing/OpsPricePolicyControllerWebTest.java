package com.guesthouse.opsapi.pricing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.opsapi.pricing.api.CreatePricePolicyRequest;
import com.guesthouse.opsapi.pricing.service.OpsPricePolicyCommandService;
import com.guesthouse.opsapi.pricing.service.OpsPricePolicyManagementView;
import com.guesthouse.opsapi.pricing.service.OpsPricePolicyQueryService;
import com.guesthouse.opsapi.pricing.service.PricePolicyMutationResult;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.pricing.model.OpsPricePolicyRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingAccommodationOptionRecord;
import com.guesthouse.shared.db.pricing.model.OpsPricingRoomTypeOptionRecord;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
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

import java.math.BigDecimal;
import java.time.LocalDate;
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

@WebMvcTest(controllers = OpsPricePolicyController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class OpsPricePolicyControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OpsPricePolicyQueryService opsPricePolicyQueryService;

    @MockBean
    private OpsPricePolicyCommandService opsPricePolicyCommandService;

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
    void pricePoliciesReturnsManagementView() throws Exception {
        when(opsPricePolicyQueryService.getPricePolicyManagementView(any(SessionUser.class), eq(501L), eq(1001L)))
                .thenReturn(managementView());

        mockMvc.perform(
                        get("/api/v1/price-policies")
                                .param("accommodationId", "501")
                                .param("roomTypeId", "1001")
                                .session(hostSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.selectedAccommodationId").value(501))
                .andExpect(jsonPath("$.data.selectedRoomTypeId").value(1001))
                .andExpect(jsonPath("$.data.policies[0].policyId").value(901))
                .andExpect(jsonPath("$.data.policies[0].status").value("ACTIVE"));
    }

    @Test
    void createPricePolicyReturnsMutationResult() throws Exception {
        when(opsPricePolicyCommandService.createPricePolicy(any(CreatePricePolicyRequest.class), any(SessionUser.class)))
                .thenReturn(new PricePolicyMutationResult(
                        901L,
                        501L,
                        "Seoul Bridge Guesthouse",
                        1001L,
                        "Standard Double",
                        "Weekend uplift",
                        LocalDate.of(2026, 4, 1),
                        LocalDate.of(2026, 4, 30),
                        BigDecimal.valueOf(15000),
                        96,
                        "ACTIVE",
                        OffsetDateTime.parse("2026-03-25T10:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/price-policies")
                                .session(hostSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreatePricePolicyRequest(
                                        1001L,
                                        "Weekend uplift",
                                        LocalDate.of(2026, 4, 1),
                                        LocalDate.of(2026, 4, 30),
                                        BigDecimal.valueOf(15000),
                                        96
                                )))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.policyId").value(901))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void deactivatePricePolicyReturnsInactiveResult() throws Exception {
        when(opsPricePolicyCommandService.deactivatePricePolicy(eq(901L), any(SessionUser.class)))
                .thenReturn(new PricePolicyMutationResult(
                        901L,
                        501L,
                        "Seoul Bridge Guesthouse",
                        1001L,
                        "Standard Double",
                        "Weekend uplift",
                        LocalDate.of(2026, 4, 1),
                        LocalDate.of(2026, 4, 30),
                        BigDecimal.valueOf(15000),
                        96,
                        "INACTIVE",
                        OffsetDateTime.parse("2026-03-25T11:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/price-policies/901/deactivate")
                                .session(adminSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));
    }

    @Test
    void pricePoliciesRejectGuestSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));

        mockMvc.perform(
                        get("/api/v1/price-policies")
                                .session(session)
                )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    private MockHttpSession hostSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST));
        return session;
    }

    private MockHttpSession adminSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(103L, "admin.demo", "Admin Demo", UserRole.ADMIN));
        return session;
    }

    private OpsPricePolicyManagementView managementView() {
        OpsPricingAccommodationOptionRecord accommodation = new OpsPricingAccommodationOptionRecord();
        accommodation.setAccommodationId(501L);
        accommodation.setAccommodationName("Seoul Bridge Guesthouse");
        accommodation.setRegion("SEOUL");

        OpsPricingRoomTypeOptionRecord roomType = new OpsPricingRoomTypeOptionRecord();
        roomType.setRoomTypeId(1001L);
        roomType.setAccommodationId(501L);
        roomType.setRoomTypeName("Standard Double");
        roomType.setBasePrice(BigDecimal.valueOf(80000));

        OpsPricePolicyRecord policy = new OpsPricePolicyRecord();
        policy.setPolicyId(901L);
        policy.setAccommodationId(501L);
        policy.setAccommodationName("Seoul Bridge Guesthouse");
        policy.setRoomTypeId(1001L);
        policy.setRoomTypeName("Standard Double");
        policy.setPolicyName("Weekend uplift");
        policy.setStartDate(LocalDate.of(2026, 4, 1));
        policy.setEndDate(LocalDate.of(2026, 4, 30));
        policy.setDeltaAmount(BigDecimal.valueOf(15000));
        policy.setDayOfWeekMask(96);
        policy.setStatus("ACTIVE");
        policy.setCreatedAt(java.time.LocalDateTime.of(2026, 3, 25, 10, 0));

        return new OpsPricePolicyManagementView(
                501L,
                1001L,
                List.of(accommodation),
                List.of(roomType),
                List.of(policy)
        );
    }
}
