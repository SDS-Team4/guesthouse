package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.GuestReservationCancellationTargetRecord;
import com.guesthouse.shared.db.reservation.model.ReservationStatusHistoryInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestReservationCancellationServiceTest {

    @Mock
    private ReservationQueryMapper reservationQueryMapper;

    @Mock
    private ReservationCommandMapper reservationCommandMapper;

    private GuestReservationCancellationService guestReservationCancellationService;

    @BeforeEach
    void setUp() {
        guestReservationCancellationService = new GuestReservationCancellationService(
                reservationQueryMapper,
                reservationCommandMapper,
                Clock.fixed(Instant.parse("2026-04-10T01:00:00Z"), ZoneId.of("Asia/Seoul"))
        );
    }

    @Test
    void cancelReservationCancelsPendingReservationBeforeCutoff() {
        when(reservationQueryMapper.lockReservationCancellationTargetByReservationIdAndGuestUserId(901L, 101L))
                .thenReturn(buildTarget(ReservationStatus.PENDING, LocalDate.of(2026, 4, 12), LocalTime.of(15, 0)));
        when(reservationCommandMapper.markReservationCancelledByGuest(
                org.mockito.ArgumentMatchers.eq(901L),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(1);

        GuestReservationCancellationResult result =
                guestReservationCancellationService.cancelReservation(101L, 901L);

        assertEquals(ReservationStatus.CANCELLED, result.status());
        assertEquals("GH-202604-0001", result.reservationNo());

        ArgumentCaptor<ReservationStatusHistoryInsertParam> historyCaptor =
                ArgumentCaptor.forClass(ReservationStatusHistoryInsertParam.class);
        verify(reservationCommandMapper).insertReservationStatusHistory(historyCaptor.capture());
        assertEquals(ReservationActionType.GUEST_CANCELLED, historyCaptor.getValue().getActionType());
        assertEquals(ReservationStatus.PENDING, historyCaptor.getValue().getFromStatus());
        assertEquals(ReservationStatus.CANCELLED, historyCaptor.getValue().getToStatus());
    }

    @Test
    void cancelReservationCancelsConfirmedReservationBeforeCutoff() {
        when(reservationQueryMapper.lockReservationCancellationTargetByReservationIdAndGuestUserId(901L, 101L))
                .thenReturn(buildTarget(ReservationStatus.CONFIRMED, LocalDate.of(2026, 4, 12), LocalTime.of(15, 0)));
        when(reservationCommandMapper.markReservationCancelledByGuest(
                org.mockito.ArgumentMatchers.eq(901L),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(1);

        GuestReservationCancellationResult result =
                guestReservationCancellationService.cancelReservation(101L, 901L);

        assertEquals(ReservationStatus.CANCELLED, result.status());
    }

    @Test
    void cancelReservationRejectsRequestAfterCutoff() {
        when(reservationQueryMapper.lockReservationCancellationTargetByReservationIdAndGuestUserId(901L, 101L))
                .thenReturn(buildTarget(ReservationStatus.PENDING, LocalDate.of(2026, 4, 10), LocalTime.of(10, 0)));

        AppException exception = assertThrows(
                AppException.class,
                () -> guestReservationCancellationService.cancelReservation(101L, 901L)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        assertEquals("Cancellation is not allowed after the check-in time.", exception.getMessage());
    }

    @Test
    void cancelReservationRejectsInvalidStatus() {
        when(reservationQueryMapper.lockReservationCancellationTargetByReservationIdAndGuestUserId(901L, 101L))
                .thenReturn(buildTarget(ReservationStatus.CANCELLED, LocalDate.of(2026, 4, 12), LocalTime.of(15, 0)));

        AppException exception = assertThrows(
                AppException.class,
                () -> guestReservationCancellationService.cancelReservation(101L, 901L)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        assertEquals("Reservation cannot be cancelled in its current status.", exception.getMessage());
    }

    private GuestReservationCancellationTargetRecord buildTarget(
            ReservationStatus status,
            LocalDate checkInDate,
            LocalTime checkInTime
    ) {
        GuestReservationCancellationTargetRecord target = new GuestReservationCancellationTargetRecord();
        target.setReservationId(901L);
        target.setReservationNo("GH-202604-0001");
        target.setStatus(status);
        target.setCheckInDate(checkInDate);
        target.setCheckInTime(checkInTime);
        return target;
    }
}
