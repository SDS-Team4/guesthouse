package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.roomblock.mapper.RoomBlockQueryMapper;
import com.guesthouse.shared.db.roomblock.model.OpsAccommodationOptionRecord;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.AccommodationOccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.ActivePricePolicyRecord;
import com.guesthouse.shared.db.reservation.model.ActiveRoomInventoryRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationBlockContextRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationListRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationNightRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationStatusHistoryRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import com.guesthouse.shared.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpsReservationQueryServiceTest {

    @Mock
    private ReservationQueryMapper reservationQueryMapper;

    @Mock
    private RoomBlockQueryMapper roomBlockQueryMapper;

    @Mock
    private OpsReservationRoomAvailabilitySupport roomAvailabilitySupport;

    private OpsReservationQueryService opsReservationQueryService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-04-14T00:00:00Z"), ZoneId.of("Asia/Seoul"));
        opsReservationQueryService = new OpsReservationQueryService(
                reservationQueryMapper,
                roomBlockQueryMapper,
                roomAvailabilitySupport,
                fixedClock
        );
    }

    @Test
    void getReservationDetailBuildsNightCandidatesAndContext() {
        OpsReservationDetailRecord detailRecord = detailRecord();
        OpsReservationNightRecord todayNight = todayNight();
        OpsReservationNightRecord pastNight = pastNight();
        OpsReservationBlockContextRecord blockContext = blockContext();
        ActivePricePolicyRecord pricePolicy = pricePolicy();
        List<AccommodationOccupiedRoomNightRecord> occupiedNights = List.of(
                occupiedNight(7001L, LocalDate.of(2026, 4, 14)),
                occupiedNight(7003L, LocalDate.of(2026, 4, 13))
        );

        when(reservationQueryMapper.findOpsReservationDetailByReservationId(902L)).thenReturn(detailRecord);
        when(reservationQueryMapper.findOpsReservationNightsByReservationIds(List.of(902L)))
                .thenReturn(List.of(todayNight, pastNight));
        when(reservationQueryMapper.findActiveRoomBlockContextsByAccommodationIdForDateRange(
                501L,
                LocalDate.of(2026, 4, 13),
                LocalDate.of(2026, 4, 16)
        )).thenReturn(List.of(blockContext));
        when(reservationQueryMapper.findActivePricePoliciesByRoomTypeIdForDateRange(
                501L,
                1001L,
                LocalDate.of(2026, 4, 13),
                LocalDate.of(2026, 4, 16)
        )).thenReturn(List.of(pricePolicy));
        when(roomAvailabilitySupport.loadActiveRoomsById(501L)).thenReturn(Map.of(
                7001L, room(7001L, "301", 1001L, "Standard Double"),
                7002L, room(7002L, "302", 1002L, "Deluxe Twin"),
                7003L, room(7003L, "303", 1001L, "Standard Double")
        ));
        when(roomAvailabilitySupport.buildBlockedRoomsByDate(
                List.of(blockContext),
                LocalDate.of(2026, 4, 13),
                LocalDate.of(2026, 4, 16)
        )).thenReturn(Map.of(
                LocalDate.of(2026, 4, 14), java.util.Set.of(7003L)
        ));
        when(roomAvailabilitySupport.buildOccupiedRoomsByDate(occupiedNights)).thenReturn(Map.of(
                LocalDate.of(2026, 4, 14), java.util.Set.of(7001L),
                LocalDate.of(2026, 4, 13), java.util.Set.of(7003L)
        ));
        when(reservationQueryMapper.findOccupiedRoomNightsByAccommodationIdsForDateRange(
                List.of(501L),
                LocalDate.of(2026, 4, 13),
                LocalDate.of(2026, 4, 16)
        )).thenReturn(occupiedNights);
        when(reservationQueryMapper.findOpsReservationStatusHistoryByReservationId(902L))
                .thenReturn(List.of(new OpsReservationStatusHistoryRecord()));

        OpsReservationDetailView detailView = opsReservationQueryService.getReservationDetail(
                902L,
                new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST)
        );

        assertTrue(detailView.reassignmentPossible());
        assertEquals(2, detailView.nights().size());
        assertEquals(1, detailView.blockContexts().size());
        assertEquals(1, detailView.pricingPolicies().size());

        OpsReservationNightView todayNightView = detailView.nights().get(0);
        assertTrue(todayNightView.reassignmentAllowed());
        assertEquals(1, todayNightView.availableReassignmentRooms().size());
        assertEquals(7002L, todayNightView.availableReassignmentRooms().get(0).roomId());

        OpsReservationNightView pastNightView = detailView.nights().get(1);
        assertFalse(pastNightView.reassignmentAllowed());
        assertEquals("Past nights cannot be reassigned.", pastNightView.reassignmentBlockedReason());
    }

    @Test
    void getReservationDetailRejectsUnownedHost() {
        OpsReservationDetailRecord detailRecord = detailRecord();
        detailRecord.setHostUserId(999L);
        when(reservationQueryMapper.findOpsReservationDetailByReservationId(anyLong())).thenReturn(detailRecord);

        AppException exception = assertThrows(
                AppException.class,
                () -> opsReservationQueryService.getReservationDetail(
                        902L,
                        new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST)
                )
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void getReservationCalendarBuildsGroupedRowsAssignmentsAndBlockCells() {
        OpsAccommodationOptionRecord accommodation = new OpsAccommodationOptionRecord();
        accommodation.setAccommodationId(501L);
        accommodation.setAccommodationName("Seoul Bridge Guesthouse");
        accommodation.setRegion("SEOUL");

        OpsReservationListRecord summaryRecord = new OpsReservationListRecord();
        summaryRecord.setReservationId(902L);
        summaryRecord.setReservationNo("GH-202604-0002");
        summaryRecord.setGuestLoginId("guest.demo");
        summaryRecord.setGuestName("Guest Demo");
        summaryRecord.setGuestCount(2);
        summaryRecord.setAccommodationId(501L);
        summaryRecord.setAccommodationName("Seoul Bridge Guesthouse");
        summaryRecord.setRoomTypeId(1001L);
        summaryRecord.setRoomTypeName("Standard Double");
        summaryRecord.setStatus(ReservationStatus.PENDING);
        summaryRecord.setCheckInDate(LocalDate.of(2026, 4, 14));
        summaryRecord.setCheckOutDate(LocalDate.of(2026, 4, 16));
        summaryRecord.setRequestedAt(LocalDateTime.of(2026, 4, 13, 18, 0));
        summaryRecord.setReassignmentPossible(true);

        OpsReservationNightRecord nightOne = todayNight();
        OpsReservationNightRecord nightTwo = new OpsReservationNightRecord();
        nightTwo.setReservationNightId(3003L);
        nightTwo.setReservationId(902L);
        nightTwo.setStayDate(LocalDate.of(2026, 4, 15));
        nightTwo.setAssignedRoomId(7002L);
        nightTwo.setAssignedRoomCode("302");
        nightTwo.setAssignedRoomTypeId(1002L);
        nightTwo.setAssignedRoomTypeName("Deluxe Twin");

        OpsReservationBlockContextRecord blockContext = blockContext();

        when(roomBlockQueryMapper.findAccessibleAccommodations(102L, false))
                .thenReturn(List.of(accommodation));
        when(roomAvailabilitySupport.loadActiveRoomsById(501L)).thenReturn(Map.of(
                7001L, room(7001L, "301", 1001L, "Standard Double"),
                7002L, room(7002L, "302", 1002L, "Deluxe Twin"),
                7003L, room(7003L, "303", 1001L, "Standard Double")
        ));
        when(reservationQueryMapper.findOpsReservationsForCalendar(
                102L,
                false,
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2026, 4, 21),
                LocalDate.of(2026, 4, 14)
        )).thenReturn(List.of(summaryRecord));
        when(reservationQueryMapper.findOpsReservationNightsByReservationIds(List.of(902L)))
                .thenReturn(List.of(nightOne, nightTwo));
        when(reservationQueryMapper.findActiveRoomBlockContextsByAccommodationIdForDateRange(
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2026, 4, 21)
        )).thenReturn(List.of(blockContext));

        OpsReservationCalendarView calendarView = opsReservationQueryService.getReservationCalendar(
                new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST),
                501L,
                LocalDate.of(2026, 4, 14),
                7
        );

        assertEquals(501L, calendarView.selectedAccommodationId());
        assertEquals(7, calendarView.visibleDates().size());
        assertEquals(LocalDate.of(2026, 4, 14), calendarView.visibleDates().get(0));
        assertEquals(2, calendarView.roomTypes().size());
        assertEquals(1, calendarView.reservations().size());
        assertEquals(2, calendarView.assignmentCells().size());
        assertEquals(1, calendarView.blockCells().size());
        assertTrue(calendarView.assignmentCells().stream().allMatch(OpsReservationCalendarView.AssignmentCell::reassignmentAllowed));
    }

    @Test
    void getReservationCalendarAllowsYearWindow() {
        OpsAccommodationOptionRecord accommodation = new OpsAccommodationOptionRecord();
        accommodation.setAccommodationId(501L);
        accommodation.setAccommodationName("Seoul Bridge Guesthouse");
        accommodation.setRegion("SEOUL");

        when(roomBlockQueryMapper.findAccessibleAccommodations(102L, false))
                .thenReturn(List.of(accommodation));
        when(roomAvailabilitySupport.loadActiveRoomsById(501L)).thenReturn(Map.of(
                7001L, room(7001L, "301", 1001L, "Standard Double")
        ));
        when(reservationQueryMapper.findOpsReservationsForCalendar(
                102L,
                false,
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2027, 4, 14),
                LocalDate.of(2026, 4, 14)
        )).thenReturn(List.of());
        when(reservationQueryMapper.findActiveRoomBlockContextsByAccommodationIdForDateRange(
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2027, 4, 14)
        )).thenReturn(List.of());

        OpsReservationCalendarView calendarView = opsReservationQueryService.getReservationCalendar(
                new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST),
                501L,
                LocalDate.of(2026, 4, 14),
                365
        );

        assertEquals(365, calendarView.visibleDates().size());
        assertEquals(LocalDate.of(2026, 4, 14), calendarView.visibleDates().get(0));
        assertEquals(LocalDate.of(2027, 4, 13), calendarView.visibleDates().get(364));
    }

    private OpsReservationDetailRecord detailRecord() {
        OpsReservationDetailRecord record = new OpsReservationDetailRecord();
        record.setReservationId(902L);
        record.setReservationNo("GH-202604-0002");
        record.setGuestUserId(101L);
        record.setGuestLoginId("guest.demo");
        record.setGuestName("Guest Demo");
        record.setAccommodationId(501L);
        record.setAccommodationName("Seoul Bridge Guesthouse");
        record.setAccommodationRegion("SEOUL");
        record.setAccommodationAddress("123 Hangang-ro");
        record.setAccommodationCheckInTime(LocalTime.of(15, 0));
        record.setAccommodationCheckOutTime(LocalTime.of(11, 0));
        record.setRoomTypeId(1001L);
        record.setRoomTypeName("Standard Double");
        record.setHostUserId(102L);
        record.setCheckInDate(LocalDate.of(2026, 4, 13));
        record.setCheckOutDate(LocalDate.of(2026, 4, 16));
        record.setStatus(ReservationStatus.CONFIRMED);
        record.setRequestedAt(LocalDateTime.of(2026, 4, 1, 10, 0));
        return record;
    }

    private OpsReservationNightRecord todayNight() {
        OpsReservationNightRecord record = new OpsReservationNightRecord();
        record.setReservationNightId(3002L);
        record.setReservationId(902L);
        record.setStayDate(LocalDate.of(2026, 4, 14));
        record.setAssignedRoomId(7001L);
        record.setAssignedRoomCode("301");
        record.setAssignedRoomTypeId(1001L);
        record.setAssignedRoomTypeName("Standard Double");
        return record;
    }

    private OpsReservationNightRecord pastNight() {
        OpsReservationNightRecord record = new OpsReservationNightRecord();
        record.setReservationNightId(3001L);
        record.setReservationId(902L);
        record.setStayDate(LocalDate.of(2026, 4, 13));
        record.setAssignedRoomId(7003L);
        record.setAssignedRoomCode("303");
        record.setAssignedRoomTypeId(1001L);
        record.setAssignedRoomTypeName("Standard Double");
        return record;
    }

    private OpsReservationBlockContextRecord blockContext() {
        OpsReservationBlockContextRecord record = new OpsReservationBlockContextRecord();
        record.setBlockId(88L);
        record.setRoomId(7003L);
        record.setRoomCode("303");
        record.setRoomTypeId(1001L);
        record.setRoomTypeName("Standard Double");
        record.setStartDate(LocalDate.of(2026, 4, 14));
        record.setEndDate(LocalDate.of(2026, 4, 14));
        record.setReasonType("MAINTENANCE");
        record.setReasonText("Boiler");
        return record;
    }

    private ActivePricePolicyRecord pricePolicy() {
        ActivePricePolicyRecord record = new ActivePricePolicyRecord();
        record.setPolicyId(77L);
        record.setRoomTypeId(1001L);
        record.setRoomTypeName("Standard Double");
        record.setPolicyName("Spring Weekend");
        record.setStartDate(LocalDate.of(2026, 4, 1));
        record.setEndDate(LocalDate.of(2026, 4, 30));
        record.setDeltaAmount(new BigDecimal("15000.00"));
        return record;
    }

    private ActiveRoomInventoryRecord room(Long roomId, String roomCode, Long roomTypeId, String roomTypeName) {
        ActiveRoomInventoryRecord record = new ActiveRoomInventoryRecord();
        record.setRoomId(roomId);
        record.setAccommodationId(501L);
        record.setRoomCode(roomCode);
        record.setRoomTypeId(roomTypeId);
        record.setRoomTypeName(roomTypeName);
        return record;
    }

    private AccommodationOccupiedRoomNightRecord occupiedNight(Long roomId, LocalDate stayDate) {
        AccommodationOccupiedRoomNightRecord record = new AccommodationOccupiedRoomNightRecord();
        record.setAccommodationId(501L);
        record.setRoomId(roomId);
        record.setStayDate(stayDate);
        return record;
    }
}
