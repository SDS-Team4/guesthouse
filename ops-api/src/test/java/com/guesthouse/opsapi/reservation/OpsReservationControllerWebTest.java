package com.guesthouse.opsapi.reservation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetCommandMapper;
import com.guesthouse.opsapi.hostasset.mapper.HostAssetQueryMapper;
import com.guesthouse.opsapi.reservation.api.CancelReservationRequest;
import com.guesthouse.opsapi.reservation.api.ReassignReservationNightChangeRequest;
import com.guesthouse.opsapi.reservation.api.ReassignReservationRequest;
import com.guesthouse.opsapi.reservation.api.SwapReservationNightRequest;
import com.guesthouse.opsapi.reservation.api.RejectReservationRequest;
import com.guesthouse.opsapi.reservation.service.OpsReassignmentCandidateView;
import com.guesthouse.opsapi.reservation.service.OpsReservationCalendarView;
import com.guesthouse.opsapi.reservation.service.OpsReservationDetailView;
import com.guesthouse.opsapi.reservation.service.OpsReservationNightView;
import com.guesthouse.opsapi.reservation.service.OpsReservationQueryService;
import com.guesthouse.opsapi.reservation.service.ReservationNightSwapResult;
import com.guesthouse.opsapi.reservation.service.ReservationDecisionResult;
import com.guesthouse.opsapi.reservation.service.ReservationDecisionService;
import com.guesthouse.opsapi.reservation.service.ReservationReassignmentResult;
import com.guesthouse.opsapi.reservation.service.ReservationReassignmentService;
import com.guesthouse.shared.auth.config.AuthWebMvcConfigurer;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.auth.mapper.UserLoginSecurityMapper;
import com.guesthouse.shared.db.auth.mapper.UserQueryMapper;
import com.guesthouse.shared.db.audit.mapper.AuditLogMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestCommandMapper;
import com.guesthouse.shared.db.hostrole.mapper.HostRoleRequestQueryMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyCommandMapper;
import com.guesthouse.shared.db.pricing.mapper.PricePolicyQueryMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockCommandMapper;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationBlockContextRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationListRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationNightRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationStatusHistoryRecord;
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
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
import java.time.LocalDateTime;
import java.time.LocalTime;
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

@WebMvcTest(controllers = OpsReservationController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class OpsReservationControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OpsReservationQueryService opsReservationQueryService;

    @MockBean
    private ReservationDecisionService reservationDecisionService;

    @MockBean
    private ReservationReassignmentService reservationReassignmentService;

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
    void reservationsReturnsFilteredListForHost() throws Exception {
        when(opsReservationQueryService.findReservations(any(SessionUser.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(summaryReservation(ReservationStatus.CONFIRMED)));

        mockMvc.perform(
                        get("/api/v1/reservations")
                                .param("status", "CONFIRMED")
                                .session(hostSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].reservationId").value(902))
                .andExpect(jsonPath("$.data[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data[0].reassignmentPossible").value(true));
    }

    @Test
    void pendingReservationsAliasReturnsPendingList() throws Exception {
        when(opsReservationQueryService.findReservations(any(SessionUser.class), eq(ReservationStatus.PENDING)))
                .thenReturn(List.of(summaryReservation(ReservationStatus.PENDING)));

        mockMvc.perform(
                        get("/api/v1/reservations/pending")
                                .session(hostSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
    }

    @Test
    void reservationDetailReturnsExpandedView() throws Exception {
        when(opsReservationQueryService.getReservationDetail(902L, new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST)))
                .thenReturn(detailView());

        mockMvc.perform(
                        get("/api/v1/reservations/902")
                                .session(hostSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reservationId").value(902))
                .andExpect(jsonPath("$.data.guest.guestLoginId").value("guest.demo"))
                .andExpect(jsonPath("$.data.nights[0].assignedRoomCode").value("301"))
                .andExpect(jsonPath("$.data.nights[0].availableReassignmentRooms[0].roomCode").value("302"))
                .andExpect(jsonPath("$.data.pricingPolicies[0].policyName").value("Spring Weekend"));
    }

    @Test
    void reservationCalendarReturnsGroupedGridData() throws Exception {
        when(opsReservationQueryService.getReservationCalendar(
                any(SessionUser.class),
                eq(501L),
                eq(LocalDate.of(2026, 4, 14)),
                eq(365)
        )).thenReturn(calendarView());

        mockMvc.perform(
                        get("/api/v1/reservations/calendar")
                                .param("accommodationId", "501")
                                .param("startDate", "2026-04-14")
                                .param("days", "365")
                                .session(hostSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.selectedAccommodationId").value(501))
                .andExpect(jsonPath("$.data.visibleDates[0]").value("2026-04-14"))
                .andExpect(jsonPath("$.data.roomTypes[0].rooms[0].roomCode").value("301"))
                .andExpect(jsonPath("$.data.reservations[0].reservationNo").value("GH-202604-0002"))
                .andExpect(jsonPath("$.data.assignmentCells[0].reservationNightId").value(3001))
                .andExpect(jsonPath("$.data.blockCells[0].roomId").value(7005));
    }

    @Test
    void approveReservationReturnsConfirmedResultForAdmin() throws Exception {
        when(reservationDecisionService.approveReservation(eq(902L), any(SessionUser.class)))
                .thenReturn(new ReservationDecisionResult(
                        902L,
                        "GH-202604-0002",
                        ReservationStatus.CONFIRMED,
                        OffsetDateTime.parse("2026-04-03T12:00:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/reservations/902/approve")
                                .session(adminSession())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
    }

    @Test
    void rejectReservationReturnsCancelledResult() throws Exception {
        when(reservationDecisionService.rejectReservation(eq(902L), any(SessionUser.class), eq("Need maintenance")))
                .thenReturn(new ReservationDecisionResult(
                        902L,
                        "GH-202604-0002",
                        ReservationStatus.CANCELLED,
                        OffsetDateTime.parse("2026-04-03T12:05:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/reservations/902/reject")
                                .session(hostSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new RejectReservationRequest("Need maintenance")))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    void cancelReservationReturnsCancelledResultForHost() throws Exception {
        when(reservationDecisionService.cancelReservation(eq(902L), any(SessionUser.class), eq("Guest requested change")))
                .thenReturn(new ReservationDecisionResult(
                        902L,
                        "GH-202604-0002",
                        ReservationStatus.CANCELLED,
                        OffsetDateTime.parse("2026-04-03T12:07:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/reservations/902/cancel")
                                .session(hostSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new CancelReservationRequest("Guest requested change")))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    @Test
    void reassignReservationReturnsChangedNightCount() throws Exception {
        when(reservationReassignmentService.reassignReservation(eq(902L), any(), any(SessionUser.class)))
                .thenReturn(new ReservationReassignmentResult(
                        902L,
                        "GH-202604-0002",
                        1,
                        OffsetDateTime.parse("2026-04-03T12:10:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/reservations/902/reassign")
                                .session(hostSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new ReassignReservationRequest(
                                        List.of(new ReassignReservationNightChangeRequest(3001L, 7002L))
                                )))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.changedNightCount").value(1));
    }

    @Test
    void swapReservationNightsReturnsBothReservationNumbers() throws Exception {
        when(reservationReassignmentService.swapReservationNights(any(), any(SessionUser.class)))
                .thenReturn(new ReservationNightSwapResult(
                        902L,
                        "GH-202604-0002",
                        903L,
                        "GH-202604-0003",
                        LocalDate.of(2026, 4, 14),
                        OffsetDateTime.parse("2026-04-03T12:11:00+09:00")
                ));

        mockMvc.perform(
                        post("/api/v1/reservations/swap-nights")
                                .session(hostSession())
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new SwapReservationNightRequest(902L, 3001L, 903L, 3002L)))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sourceReservationNo").value("GH-202604-0002"))
                .andExpect(jsonPath("$.data.targetReservationNo").value("GH-202604-0003"))
                .andExpect(jsonPath("$.data.stayDate").value("2026-04-14"));
    }

    @Test
    void reservationsRejectGuestSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));

        mockMvc.perform(
                        get("/api/v1/reservations")
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
        session.setAttribute("SESSION_USER", new SessionUser(999L, "admin.demo", "Admin Demo", UserRole.ADMIN));
        return session;
    }

    private OpsReservationListRecord summaryReservation(ReservationStatus status) {
        OpsReservationListRecord record = new OpsReservationListRecord();
        record.setReservationId(902L);
        record.setReservationNo("GH-202604-0002");
        record.setGuestUserId(101L);
        record.setGuestLoginId("guest.demo");
        record.setGuestName("Guest Demo");
        record.setAccommodationId(501L);
        record.setAccommodationName("Seoul Bridge Guesthouse");
        record.setRoomTypeId(1001L);
        record.setRoomTypeName("Standard Double");
        record.setCheckInDate(LocalDate.of(2026, 4, 14));
        record.setCheckOutDate(LocalDate.of(2026, 4, 16));
        record.setStatus(status);
        record.setRequestedAt(LocalDateTime.of(2026, 4, 2, 11, 0));
        record.setConfirmedAt(status == ReservationStatus.CONFIRMED ? LocalDateTime.of(2026, 4, 2, 12, 0) : null);
        record.setCancelledAt(status == ReservationStatus.CANCELLED ? LocalDateTime.of(2026, 4, 2, 12, 30) : null);
        record.setReassignmentPossible(status != ReservationStatus.CANCELLED);
        record.setHasRelevantBlocks(true);
        record.setHasRelevantPricing(true);
        return record;
    }

    private OpsReservationDetailView detailView() {
        OpsReservationDetailRecord reservation = new OpsReservationDetailRecord();
        reservation.setReservationId(902L);
        reservation.setReservationNo("GH-202604-0002");
        reservation.setGuestUserId(101L);
        reservation.setGuestLoginId("guest.demo");
        reservation.setGuestName("Guest Demo");
        reservation.setAccommodationId(501L);
        reservation.setAccommodationName("Seoul Bridge Guesthouse");
        reservation.setAccommodationRegion("SEOUL");
        reservation.setAccommodationAddress("123 Hangang-ro");
        reservation.setAccommodationCheckInTime(LocalTime.of(15, 0));
        reservation.setAccommodationCheckOutTime(LocalTime.of(11, 0));
        reservation.setRoomTypeId(1001L);
        reservation.setRoomTypeName("Standard Double");
        reservation.setHostUserId(102L);
        reservation.setCheckInDate(LocalDate.of(2026, 4, 14));
        reservation.setCheckOutDate(LocalDate.of(2026, 4, 16));
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setRequestedAt(LocalDateTime.of(2026, 4, 2, 11, 0));

        OpsReservationNightRecord night = new OpsReservationNightRecord();
        night.setReservationNightId(3001L);
        night.setReservationId(902L);
        night.setStayDate(LocalDate.of(2026, 4, 14));
        night.setAssignedRoomId(7001L);
        night.setAssignedRoomCode("301");
        night.setAssignedRoomTypeId(1001L);
        night.setAssignedRoomTypeName("Standard Double");

        OpsReservationStatusHistoryRecord history = new OpsReservationStatusHistoryRecord();
        history.setHistoryId(1L);
        history.setFromStatus(null);
        history.setToStatus(ReservationStatus.PENDING);
        history.setActionType(ReservationActionType.REQUESTED);
        history.setChangedByUserId(101L);
        history.setChangedByLoginId("guest.demo");
        history.setChangedByName("Guest Demo");
        history.setChangedAt(LocalDateTime.of(2026, 4, 2, 11, 0));

        OpsReservationBlockContextRecord block = new OpsReservationBlockContextRecord();
        block.setBlockId(88L);
        block.setRoomId(7005L);
        block.setRoomCode("305");
        block.setRoomTypeId(1001L);
        block.setRoomTypeName("Standard Double");
        block.setStartDate(LocalDate.of(2026, 4, 14));
        block.setEndDate(LocalDate.of(2026, 4, 14));
        block.setReasonType("MAINTENANCE");
        block.setReasonText("Boiler issue");

        ActivePricePolicyRecord policy = new ActivePricePolicyRecord();
        policy.setPolicyId(77L);
        policy.setRoomTypeId(1001L);
        policy.setRoomTypeName("Standard Double");
        policy.setPolicyName("Spring Weekend");
        policy.setStartDate(LocalDate.of(2026, 4, 1));
        policy.setEndDate(LocalDate.of(2026, 4, 30));
        policy.setDeltaAmount(new BigDecimal("15000.00"));

        return new OpsReservationDetailView(
                reservation,
                List.of(new OpsReservationNightView(
                        night,
                        false,
                        false,
                        true,
                        null,
                        List.of(new OpsReassignmentCandidateView(7002L, "302", 1002L, "Deluxe Twin"))
                )),
                List.of(history),
                List.of(block),
                List.of(policy),
                true
        );
    }

    private OpsReservationCalendarView calendarView() {
        return new OpsReservationCalendarView(
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2026, 4, 21),
                List.of(LocalDate.of(2026, 4, 14), LocalDate.of(2026, 4, 15), LocalDate.of(2026, 4, 16)),
                List.of(new OpsReservationCalendarView.AccommodationOption(501L, "Seoul Bridge Guesthouse", "SEOUL")),
                List.of(new OpsReservationCalendarView.RoomTypeRow(
                        1001L,
                        "Standard Double",
                        List.of(new OpsReservationCalendarView.RoomRow(7001L, "301"))
                )),
                List.of(new OpsReservationCalendarView.ReservationRow(
                        902L,
                        "GH-202604-0002",
                        "guest.demo",
                        "Guest Demo",
                        2,
                        1001L,
                        "Standard Double",
                        ReservationStatus.PENDING,
                        LocalDate.of(2026, 4, 14),
                        LocalDate.of(2026, 4, 16),
                        OffsetDateTime.parse("2026-04-02T11:00:00+09:00"),
                        true
                )),
                List.of(new OpsReservationCalendarView.AssignmentCell(
                        902L,
                        3001L,
                        LocalDate.of(2026, 4, 14),
                        7001L,
                        "301",
                        1001L,
                        "Standard Double",
                        true
                )),
                List.of(new OpsReservationCalendarView.BlockCell(
                        88L,
                        7005L,
                        LocalDate.of(2026, 4, 14),
                        "MAINTENANCE",
                        "Boiler issue"
                ))
        );
    }
}
