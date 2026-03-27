package com.guesthouse.opsapi.hostasset;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetCommandMapper;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetQueryMapper;
import com.guesthouse.opsapi.hostasset.model.HostAccommodationDetailRecord;
import com.guesthouse.opsapi.hostasset.model.HostAccommodationSummaryRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomRecord;
import com.guesthouse.opsapi.hostasset.model.HostRoomTypeRecord;
import com.guesthouse.opsapi.hostasset.service.HostAssetMutationResult;
import com.guesthouse.opsapi.hostasset.service.HostAssetService;
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
import java.time.OffsetDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = HostAssetController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class HostAssetControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HostAssetService hostAssetService;

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

    @MockBean
    private HostAssetQueryMapper hostAssetQueryMapper;

    @MockBean
    private HostAssetCommandMapper hostAssetCommandMapper;

    @Test
    void accommodationsReturnsHostScopedList() throws Exception {
        HostAccommodationSummaryRecord record = new HostAccommodationSummaryRecord();
        record.setAccommodationId(501L);
        record.setName("Seoul Bridge Guesthouse");
        record.setRegion("SEOUL");
        record.setAddress("123 Hangang-ro");
        record.setStatus("ACTIVE");
        record.setRoomTypeCount(2);
        record.setRoomCount(5);
        record.setActiveRoomCount(4);
        record.setPendingReservationCount(1);

        when(hostAssetService.findAccommodations(any(SessionUser.class))).thenReturn(List.of(record));

        mockMvc.perform(get("/api/v1/host/accommodations").session(hostSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].accommodationId").value(501))
                .andExpect(jsonPath("$.data[0].name").value("Seoul Bridge Guesthouse"))
                .andExpect(jsonPath("$.data[0].roomCount").value(5));
    }

    @Test
    void accommodationDetailReturnsRoomsAndRoomTypes() throws Exception {
        HostAccommodationDetailRecord detail = new HostAccommodationDetailRecord();
        detail.setAccommodationId(501L);
        detail.setName("Seoul Bridge Guesthouse");
        detail.setRegion("SEOUL");
        detail.setAddress("123 Hangang-ro");
        detail.setInfoText("Han river view");
        detail.setCheckInTime(LocalTime.of(15, 0));
        detail.setCheckOutTime(LocalTime.of(11, 0));
        detail.setStatus("ACTIVE");
        detail.setRoomTypeCount(2);
        detail.setRoomCount(5);
        detail.setActiveRoomCount(4);
        detail.setPendingReservationCount(1);
        detail.setActiveBlockCount(1);
        detail.setActivePricePolicyCount(2);

        HostRoomTypeRecord roomType = new HostRoomTypeRecord();
        roomType.setRoomTypeId(1001L);
        roomType.setAccommodationId(501L);
        roomType.setName("Standard Double");
        roomType.setBaseCapacity(2);
        roomType.setMaxCapacity(2);
        roomType.setBasePrice(BigDecimal.valueOf(85000));
        roomType.setStatus("ACTIVE");
        roomType.setRoomCount(2);
        roomType.setActiveRoomCount(2);

        HostRoomRecord room = new HostRoomRecord();
        room.setRoomId(7001L);
        room.setAccommodationId(501L);
        room.setRoomTypeId(1001L);
        room.setRoomTypeName("Standard Double");
        room.setRoomCode("301");
        room.setStatus("ACTIVE");
        room.setMemo("Near elevator");
        room.setHasFutureAssignments(true);

        when(hostAssetService.getAccommodationDetail(eq(501L), any(SessionUser.class)))
                .thenReturn(new HostAssetService.HostAccommodationDetailBundle(detail, List.of(roomType), List.of(room)));

        mockMvc.perform(get("/api/v1/host/accommodations/501").session(hostSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Seoul Bridge Guesthouse"))
                .andExpect(jsonPath("$.data.roomTypes[0].name").value("Standard Double"))
                .andExpect(jsonPath("$.data.rooms[0].roomCode").value("301"))
                .andExpect(jsonPath("$.data.rooms[0].hasFutureAssignments").value(true));
    }

    @Test
    void createAccommodationReturnsMutationPayload() throws Exception {
        when(hostAssetService.createAccommodation(any(), any(SessionUser.class)))
                .thenReturn(new HostAssetMutationResult(
                        501L,
                        "Seoul Bridge Guesthouse",
                        "ACTIVE",
                        OffsetDateTime.parse("2026-03-26T12:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/host/accommodations")
                                .session(hostSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CreateAccommodationFixture()))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assetId").value(501))
                .andExpect(jsonPath("$.data.assetName").value("Seoul Bridge Guesthouse"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    void accommodationsRejectAdminSession() throws Exception {
        mockMvc.perform(get("/api/v1/host/accommodations").session(adminSession()))
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
        session.setAttribute("SESSION_USER", new SessionUser(999L, "admin.demo", "Admin Demo", UserRole.ADMIN));
        return session;
    }

    private record CreateAccommodationFixture(
            String name,
            String address,
            String region,
            String infoText,
            String checkInTime,
            String checkOutTime
    ) {
        private CreateAccommodationFixture() {
            this(
                    "Seoul Bridge Guesthouse",
                    "123 Hangang-ro",
                    "SEOUL",
                    "Han river view",
                    "15:00:00",
                    "11:00:00"
            );
        }
    }
}
