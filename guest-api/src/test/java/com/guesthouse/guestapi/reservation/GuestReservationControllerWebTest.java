package com.guesthouse.guestapi.reservation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.guesthouse.guestapi.reservation.service.GuestReservationQueryService;
import com.guesthouse.guestapi.reservation.service.CreateReservationResult;
import com.guesthouse.guestapi.reservation.service.GuestReservationCancellationResult;
import com.guesthouse.guestapi.reservation.service.GuestReservationCancellationService;
import com.guesthouse.guestapi.reservation.service.GuestReservationDetailView;
import com.guesthouse.guestapi.reservation.service.ReservationRequestService;
import com.guesthouse.shared.db.reservation.model.GuestReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationNightRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationStatusHistoryRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationSummaryRecord;
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
import com.guesthouse.shared.db.term.mapper.TermQueryMapper;
import com.guesthouse.shared.db.term.mapper.UserTermAgreementCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountCommandMapper;
import com.guesthouse.shared.db.user.mapper.UserAccountQueryMapper;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import com.guesthouse.shared.domain.user.UserRole;
import com.guesthouse.shared.domain.web.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = GuestReservationController.class)
@Import({GlobalExceptionHandler.class, AuthWebMvcConfigurer.class})
class GuestReservationControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReservationRequestService reservationRequestService;

    @MockBean
    private GuestReservationQueryService guestReservationQueryService;

    @MockBean
    private GuestReservationCancellationService guestReservationCancellationService;

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

    @MockBean
    private TermQueryMapper termQueryMapper;

    @MockBean
    private UserTermAgreementCommandMapper userTermAgreementCommandMapper;

    @Test
    void createReservationReturnsPendingReservationForAuthenticatedGuest() throws Exception {
        when(reservationRequestService.createReservation(any()))
                .thenReturn(new CreateReservationResult(
                        903L,
                        "GH-20260401100000-123456",
                        501L,
                        "Seoul Bridge Guesthouse",
                        1001L,
                        "Standard Double",
                        2,
                        LocalDate.of(2026, 4, 12),
                        LocalDate.of(2026, 4, 14),
                        ReservationStatus.PENDING,
                        OffsetDateTime.now(ZoneId.of("Asia/Seoul"))
                ));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "김게스트", UserRole.GUEST));

        mockMvc.perform(
                        post("/api/v1/reservations")
                                .session(session)
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new ReservationPayload(
                                        1001L,
                                        2,
                                        LocalDate.of(2026, 4, 12),
                                        LocalDate.of(2026, 4, 14)
                                )))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reservationId").value(903))
                .andExpect(jsonPath("$.data.accommodationName").value("Seoul Bridge Guesthouse"))
                .andExpect(jsonPath("$.data.roomTypeName").value("Standard Double"))
                .andExpect(jsonPath("$.data.guestCount").value(2))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void createReservationRequiresAuthenticatedGuestSession() throws Exception {
        mockMvc.perform(
                        post("/api/v1/reservations")
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new ReservationPayload(
                                        1001L,
                                        2,
                                        LocalDate.of(2026, 4, 12),
                                        LocalDate.of(2026, 4, 14)
                                )))
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void createReservationReturnsConflictWhenInventoryIsUnavailable() throws Exception {
        when(reservationRequestService.createReservation(any()))
                .thenThrow(new AppException(
                        ErrorCode.INVENTORY_UNAVAILABLE,
                        HttpStatus.CONFLICT,
                        ErrorCode.INVENTORY_UNAVAILABLE.getDefaultMessage()
                ));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "김게스트", UserRole.GUEST));

        mockMvc.perform(
                        post("/api/v1/reservations")
                                .session(session)
                                .contentType(APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new ReservationPayload(
                                        1001L,
                                        2,
                                        LocalDate.of(2026, 4, 12),
                                        LocalDate.of(2026, 4, 14)
                                )))
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("INVENTORY_UNAVAILABLE"));
    }

    @Test
    void myReservationsReturnsGuestScopedReservationList() throws Exception {
        GuestReservationSummaryRecord summaryRecord = new GuestReservationSummaryRecord();
        summaryRecord.setReservationId(903L);
        summaryRecord.setReservationNo("GH-20260401100000-123456");
        summaryRecord.setAccommodationId(501L);
        summaryRecord.setAccommodationName("Seoul Bridge Guesthouse");
        summaryRecord.setRoomTypeId(1001L);
        summaryRecord.setRoomTypeName("Standard Double");
        summaryRecord.setGuestCount(2);
        summaryRecord.setCheckInDate(LocalDate.of(2026, 4, 12));
        summaryRecord.setCheckOutDate(LocalDate.of(2026, 4, 14));
        summaryRecord.setStatus(ReservationStatus.PENDING);
        summaryRecord.setRequestedAt(LocalDateTime.of(2026, 4, 1, 10, 0));

        when(guestReservationQueryService.findReservationsByGuestUserId(101L))
                .thenReturn(List.of(summaryRecord));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));

        mockMvc.perform(
                        get("/api/v1/reservations/my")
                                .session(session)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].reservationId").value(903))
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
    }

    @Test
    void myReservationDetailReturnsGuestScopedDetailView() throws Exception {
        GuestReservationDetailRecord detailRecord = new GuestReservationDetailRecord();
        detailRecord.setReservationId(901L);
        detailRecord.setReservationNo("GH-202604-0001");
        detailRecord.setAccommodationId(501L);
        detailRecord.setAccommodationName("Seoul Bridge Guesthouse");
        detailRecord.setAccommodationRegion("SEOUL");
        detailRecord.setAccommodationAddress("101 Hangang-daero, Seoul");
        detailRecord.setRoomTypeId(1001L);
        detailRecord.setRoomTypeName("Standard Double");
        detailRecord.setCheckInDate(LocalDate.of(2026, 4, 12));
        detailRecord.setCheckOutDate(LocalDate.of(2026, 4, 14));
        detailRecord.setAccommodationCheckInTime(java.time.LocalTime.of(15, 0));
        detailRecord.setStatus(ReservationStatus.CONFIRMED);
        detailRecord.setGuestCount(2);
        detailRecord.setRequestedAt(LocalDateTime.of(2026, 4, 1, 10, 0));
        detailRecord.setConfirmedAt(LocalDateTime.of(2026, 4, 1, 10, 15));

        GuestReservationNightRecord firstNight = new GuestReservationNightRecord();
        firstNight.setReservationNightId(10001L);
        firstNight.setStayDate(LocalDate.of(2026, 4, 12));

        GuestReservationStatusHistoryRecord historyRecord = new GuestReservationStatusHistoryRecord();
        historyRecord.setActionType(ReservationActionType.HOST_CONFIRMED);
        historyRecord.setFromStatus(ReservationStatus.PENDING);
        historyRecord.setToStatus(ReservationStatus.CONFIRMED);
        historyRecord.setReasonType("HOST_APPROVAL");
        historyRecord.setReasonText("Reservation confirmed by host.");
        historyRecord.setChangedAt(LocalDateTime.of(2026, 4, 1, 10, 15));

        when(guestReservationQueryService.findReservationDetailByReservationId(101L, 901L))
                .thenReturn(new GuestReservationDetailView(
                        detailRecord,
                        List.of(firstNight),
                        List.of(historyRecord),
                        OffsetDateTime.parse("2026-04-12T15:00:00+09:00"),
                        true,
                        null
                ));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));

        mockMvc.perform(
                        get("/api/v1/reservations/901")
                                .session(session)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reservationNo").value("GH-202604-0001"))
                .andExpect(jsonPath("$.data.accommodation.accommodationName").value("Seoul Bridge Guesthouse"))
                .andExpect(jsonPath("$.data.roomType.roomTypeName").value("Standard Double"))
                .andExpect(jsonPath("$.data.guestCount").value(2))
                .andExpect(jsonPath("$.data.cancellationAllowed").value(true))
                .andExpect(jsonPath("$.data.nights[0].stayDate").value("2026-04-12"))
                .andExpect(jsonPath("$.data.statusHistory[0].actionType").value("HOST_CONFIRMED"));
    }

    @Test
    void myReservationDetailReturnsNotFoundForMissingGuestScopedReservation() throws Exception {
        when(guestReservationQueryService.findReservationDetailByReservationId(101L, 999L))
                .thenThrow(new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation not found."));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));

        mockMvc.perform(
                        get("/api/v1/reservations/999")
                                .session(session)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void cancelMyReservationReturnsCancelledReservationForAuthenticatedGuest() throws Exception {
        when(guestReservationCancellationService.cancelReservation(101L, 901L))
                .thenReturn(new GuestReservationCancellationResult(
                        901L,
                        "GH-202604-0001",
                        ReservationStatus.CANCELLED,
                        OffsetDateTime.parse("2026-04-10T10:00:00+09:00")
                ));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));

        mockMvc.perform(
                        post("/api/v1/reservations/901/cancel")
                                .session(session)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.reservationNo").value("GH-202604-0001"));
    }

    @Test
    void cancelMyReservationReturnsConflictAfterCheckInTime() throws Exception {
        when(guestReservationCancellationService.cancelReservation(101L, 901L))
                .thenThrow(new AppException(
                        ErrorCode.INVALID_REQUEST,
                        HttpStatus.CONFLICT,
                        "Cancellation is not allowed after the check-in time."
                ));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute("SESSION_USER", new SessionUser(101L, "guest.demo", "Guest Demo", UserRole.GUEST));

        mockMvc.perform(
                        post("/api/v1/reservations/901/cancel")
                                .session(session)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.error.message").value("Cancellation is not allowed after the check-in time."));
    }

    private record ReservationPayload(Long roomTypeId, Integer guestCount, LocalDate checkInDate, LocalDate checkOutDate) {
    }
}
