package com.guesthouse.opsapi.roomblock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetCommandMapper;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetQueryMapper;
import com.guesthouse.opsapi.roomblock.api.CreateRoomBlockRequest;
import com.guesthouse.opsapi.roomblock.service.OpsRoomBlockCommandService;
import com.guesthouse.opsapi.roomblock.service.OpsRoomBlockManagementView;
import com.guesthouse.opsapi.roomblock.service.OpsRoomBlockQueryService;
import com.guesthouse.opsapi.roomblock.service.RoomBlockMutationResult;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.roomblock.model.OpsAccommodationOptionRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomBlockRecord;
import com.guesthouse.shared.db.roomblock.model.OpsRoomOptionRecord;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
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

@WebMvcTest(controllers = OpsRoomBlockController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class OpsRoomBlockControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OpsRoomBlockQueryService opsRoomBlockQueryService;

    @MockBean
    private OpsRoomBlockCommandService opsRoomBlockCommandService;

    @MockBean
    private UserQueryMapper userQueryMapper;

    @MockBean
    private UserLoginSecurityMapper userLoginSecurityMapper;

    @MockBean
    private RoomBlockQueryMapper roomBlockQueryMapper;

    @MockBean
    private RoomBlockCommandMapper roomBlockCommandMapper;

    @MockBean
    private AuditLogMapper auditLogMapper;

    @MockBean
    private ReservationInventoryMapper reservationInventoryMapper;

    @MockBean
    private ReservationCommandMapper reservationCommandMapper;

    @MockBean
    private ReservationQueryMapper reservationQueryMapper;

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

    @MockBean
    private HostAssetQueryMapper hostAssetQueryMapper;

    @MockBean
    private HostAssetCommandMapper hostAssetCommandMapper;

    @Test
    void roomBlocksReturnsManagementView() throws Exception {
        when(opsRoomBlockQueryService.getRoomBlockManagementView(any(SessionUser.class), eq(501L), eq(2002L)))
                .thenReturn(managementView());

        mockMvc.perform(
                        get("/api/v1/room-blocks")
                                .param("accommodationId", "501")
                                .param("roomId", "2002")
                                .session(hostSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.selectedAccommodationId").value(501))
                .andExpect(jsonPath("$.data.selectedRoomId").value(2002))
                .andExpect(jsonPath("$.data.blocks[0].blockId").value(801))
                .andExpect(jsonPath("$.data.blocks[0].status").value("ACTIVE"));
    }

    @Test
    void createRoomBlockReturnsMutationResult() throws Exception {
        when(opsRoomBlockCommandService.createRoomBlock(any(CreateRoomBlockRequest.class), any(SessionUser.class)))
                .thenReturn(new RoomBlockMutationResult(
                        801L,
                        501L,
                        "Seoul Bridge Guesthouse",
                        2002L,
                        "S102",
                        "ACTIVE",
                        "MAINTENANCE",
                        "Boiler issue",
                        LocalDate.of(2026, 4, 16),
                        LocalDate.of(2026, 4, 17),
                        OffsetDateTime.parse("2026-03-25T10:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/room-blocks")
                                .session(hostSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateRoomBlockRequest(
                                        2002L,
                                        LocalDate.of(2026, 4, 16),
                                        LocalDate.of(2026, 4, 17),
                                        "MAINTENANCE",
                                        "Boiler issue"
                                )))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.blockId").value(801))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void deactivateRoomBlockReturnsInactiveResult() throws Exception {
        when(opsRoomBlockCommandService.deactivateRoomBlock(eq(801L), any(SessionUser.class)))
                .thenReturn(new RoomBlockMutationResult(
                        801L,
                        501L,
                        "Seoul Bridge Guesthouse",
                        2002L,
                        "S102",
                        "INACTIVE",
                        "MAINTENANCE",
                        "Boiler issue",
                        LocalDate.of(2026, 4, 16),
                        LocalDate.of(2026, 4, 17),
                        OffsetDateTime.parse("2026-03-25T11:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/room-blocks/801/deactivate")
                                .session(adminSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));
    }

    @Test
    void roomBlocksRejectGuestSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));

        mockMvc.perform(
                        get("/api/v1/room-blocks")
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

    private OpsRoomBlockManagementView managementView() {
        OpsAccommodationOptionRecord accommodation = new OpsAccommodationOptionRecord();
        accommodation.setAccommodationId(501L);
        accommodation.setAccommodationName("Seoul Bridge Guesthouse");
        accommodation.setRegion("SEOUL");

        OpsRoomOptionRecord room = new OpsRoomOptionRecord();
        room.setRoomId(2002L);
        room.setAccommodationId(501L);
        room.setRoomTypeId(1001L);
        room.setRoomTypeName("Standard Double");
        room.setRoomCode("S102");

        OpsRoomBlockRecord block = new OpsRoomBlockRecord();
        block.setBlockId(801L);
        block.setAccommodationId(501L);
        block.setAccommodationName("Seoul Bridge Guesthouse");
        block.setRoomId(2002L);
        block.setRoomCode("S102");
        block.setRoomTypeId(1001L);
        block.setRoomTypeName("Standard Double");
        block.setStartDate(LocalDate.of(2026, 4, 16));
        block.setEndDate(LocalDate.of(2026, 4, 17));
        block.setReasonType("MAINTENANCE");
        block.setReasonText("Boiler issue");
        block.setStatus("ACTIVE");
        block.setCreatedByUserId(102L);
        block.setCreatedByLoginId("host.demo");
        block.setCreatedByName("Host Demo");
        block.setCreatedAt(java.time.LocalDateTime.of(2026, 3, 25, 10, 0));

        return new OpsRoomBlockManagementView(
                501L,
                2002L,
                List.of(accommodation),
                List.of(room),
                List.of(block)
        );
    }
}
