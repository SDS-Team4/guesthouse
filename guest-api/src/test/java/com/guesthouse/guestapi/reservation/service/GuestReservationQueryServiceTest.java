package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.GuestReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationNightRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationStatusHistoryRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestReservationQueryServiceTest {

    @Mock
    private ReservationQueryMapper reservationQueryMapper;

    private GuestReservationQueryService guestReservationQueryService;

    @BeforeEach
    void setUp() {
        guestReservationQueryService = new GuestReservationQueryService(
                reservationQueryMapper,
                Clock.fixed(Instant.parse("2026-04-10T01:00:00Z"), ZoneId.of("Asia/Seoul"))
        );
    }

    @Test
    void findReservationDetailByReservationIdReturnsGuestScopedAggregate() {
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
        detailRecord.setAccommodationCheckInTime(LocalTime.of(15, 0));
        detailRecord.setStatus(ReservationStatus.CONFIRMED);
        detailRecord.setRequestedAt(LocalDateTime.of(2026, 4, 1, 10, 0));
        detailRecord.setConfirmedAt(LocalDateTime.of(2026, 4, 1, 10, 15));

        GuestReservationNightRecord firstNight = new GuestReservationNightRecord();
        firstNight.setReservationNightId(10001L);
        firstNight.setStayDate(LocalDate.of(2026, 4, 12));

        GuestReservationStatusHistoryRecord historyRecord = new GuestReservationStatusHistoryRecord();
        historyRecord.setActionType(ReservationActionType.HOST_CONFIRMED);
        historyRecord.setFromStatus(ReservationStatus.PENDING);
        historyRecord.setToStatus(ReservationStatus.CONFIRMED);
        historyRecord.setReasonText("Reservation confirmed by host.");
        historyRecord.setChangedAt(LocalDateTime.of(2026, 4, 1, 10, 15));

        when(reservationQueryMapper.findReservationDetailByReservationIdAndGuestUserId(901L, 101L))
                .thenReturn(detailRecord);
        when(reservationQueryMapper.findReservationNightsByReservationId(901L))
                .thenReturn(List.of(firstNight));
        when(reservationQueryMapper.findReservationStatusHistoryByReservationId(901L))
                .thenReturn(List.of(historyRecord));

        GuestReservationDetailView detailView =
                guestReservationQueryService.findReservationDetailByReservationId(101L, 901L);

        assertEquals("GH-202604-0001", detailView.reservation().getReservationNo());
        assertEquals(1, detailView.nights().size());
        assertEquals(LocalDate.of(2026, 4, 12), detailView.nights().get(0).getStayDate());
        assertEquals(1, detailView.statusHistory().size());
        assertEquals(ReservationActionType.HOST_CONFIRMED, detailView.statusHistory().get(0).getActionType());
        assertTrue(detailView.cancellationAllowed());
        assertEquals(OffsetDateTime.parse("2026-04-12T15:00:00+09:00"), detailView.cancellationCutoffAt());
    }

    @Test
    void findReservationDetailByReservationIdFailsSafelyWhenReservationIsMissingOrNotOwned() {
        when(reservationQueryMapper.findReservationDetailByReservationIdAndGuestUserId(999L, 101L))
                .thenReturn(null);

        AppException exception = assertThrows(
                AppException.class,
                () -> guestReservationQueryService.findReservationDetailByReservationId(101L, 999L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals(ErrorCode.NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void findReservationDetailByReservationIdMarksCancellationBlockedAfterCutoff() {
        GuestReservationDetailRecord detailRecord = new GuestReservationDetailRecord();
        detailRecord.setReservationId(902L);
        detailRecord.setReservationNo("GH-202604-0002");
        detailRecord.setAccommodationId(501L);
        detailRecord.setAccommodationName("Seoul Bridge Guesthouse");
        detailRecord.setAccommodationRegion("SEOUL");
        detailRecord.setAccommodationAddress("101 Hangang-daero, Seoul");
        detailRecord.setRoomTypeId(1001L);
        detailRecord.setRoomTypeName("Standard Double");
        detailRecord.setCheckInDate(LocalDate.of(2026, 4, 10));
        detailRecord.setCheckOutDate(LocalDate.of(2026, 4, 12));
        detailRecord.setAccommodationCheckInTime(LocalTime.of(10, 0));
        detailRecord.setStatus(ReservationStatus.PENDING);
        detailRecord.setRequestedAt(LocalDateTime.of(2026, 4, 9, 9, 30));

        when(reservationQueryMapper.findReservationDetailByReservationIdAndGuestUserId(902L, 101L))
                .thenReturn(detailRecord);
        when(reservationQueryMapper.findReservationNightsByReservationId(902L))
                .thenReturn(List.of());
        when(reservationQueryMapper.findReservationStatusHistoryByReservationId(902L))
                .thenReturn(List.of());

        GuestReservationDetailView detailView =
                guestReservationQueryService.findReservationDetailByReservationId(101L, 902L);

        assertFalse(detailView.cancellationAllowed());
        assertEquals("Cancellation is not allowed after the check-in time.", detailView.cancellationBlockedReason());
    }
}
