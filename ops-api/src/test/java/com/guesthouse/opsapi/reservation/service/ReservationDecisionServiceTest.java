package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.ReservationDecisionTargetRecord;
import com.guesthouse.shared.db.reservation.model.ReservationStatusHistoryInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import com.guesthouse.shared.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationDecisionServiceTest {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    @Mock
    private ReservationQueryMapper reservationQueryMapper;

    @Mock
    private ReservationCommandMapper reservationCommandMapper;

    @Mock
    private OpsReservationAuditService opsReservationAuditService;

    private ReservationDecisionService reservationDecisionService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-04-03T03:00:00Z"), BUSINESS_ZONE_ID);
        reservationDecisionService = new ReservationDecisionService(
                reservationQueryMapper,
                reservationCommandMapper,
                opsReservationAuditService,
                fixedClock
        );
    }

    @Test
    void approveReservationConfirmsPendingReservationAndWritesHistory() {
        when(reservationQueryMapper.lockReservationDecisionTarget(902L)).thenReturn(pendingReservation(102L));
        when(reservationCommandMapper.markReservationConfirmed(
                902L,
                LocalDateTime.of(2026, 4, 3, 12, 0),
                LocalDateTime.of(2026, 4, 3, 12, 0)
        )).thenReturn(1);

        ReservationDecisionResult result = reservationDecisionService.approveReservation(902L, hostActor());

        ArgumentCaptor<ReservationStatusHistoryInsertParam> historyCaptor =
                ArgumentCaptor.forClass(ReservationStatusHistoryInsertParam.class);

        verify(reservationCommandMapper).insertReservationStatusHistory(historyCaptor.capture());
        verify(opsReservationAuditService).writeReservationAudit(
                any(SessionUser.class),
                eqLong(902L),
                eqString("RESERVATION_APPROVED"),
                eqString("HOST_APPROVAL"),
                eqString("Reservation approved by operations."),
                any(Map.class),
                any(Map.class),
                eqDateTime(LocalDateTime.of(2026, 4, 3, 12, 0))
        );

        assertEquals(902L, result.reservationId());
        assertEquals("GH-202604-0002", result.reservationNo());
        assertEquals(ReservationStatus.CONFIRMED, result.status());

        ReservationStatusHistoryInsertParam history = historyCaptor.getValue();
        assertEquals(902L, history.getReservationId());
        assertEquals(ReservationStatus.PENDING, history.getFromStatus());
        assertEquals(ReservationStatus.CONFIRMED, history.getToStatus());
        assertEquals(ReservationActionType.HOST_CONFIRMED, history.getActionType());
        assertEquals(102L, history.getChangedByUserId());
        assertEquals("HOST_APPROVAL", history.getReasonType());
    }

    @Test
    void rejectReservationCancelsPendingReservationAndWritesHistory() {
        when(reservationQueryMapper.lockReservationDecisionTarget(902L)).thenReturn(pendingReservation(102L));
        when(reservationCommandMapper.markReservationCancelled(
                902L,
                LocalDateTime.of(2026, 4, 3, 12, 0),
                LocalDateTime.of(2026, 4, 3, 12, 0)
        )).thenReturn(1);

        ReservationDecisionResult result =
                reservationDecisionService.rejectReservation(902L, hostActor(), "Need maintenance");

        ArgumentCaptor<ReservationStatusHistoryInsertParam> historyCaptor =
                ArgumentCaptor.forClass(ReservationStatusHistoryInsertParam.class);

        verify(reservationCommandMapper).insertReservationStatusHistory(historyCaptor.capture());

        assertEquals(ReservationStatus.CANCELLED, result.status());
        assertEquals("GH-202604-0002", result.reservationNo());

        ReservationStatusHistoryInsertParam history = historyCaptor.getValue();
        assertEquals(ReservationStatus.CANCELLED, history.getToStatus());
        assertEquals(ReservationActionType.HOST_REJECTED, history.getActionType());
        assertEquals("HOST_REJECTION", history.getReasonType());
        assertEquals("Need maintenance", history.getReasonText());
    }

    @Test
    void approveReservationAllowsAdminActor() {
        when(reservationQueryMapper.lockReservationDecisionTarget(902L)).thenReturn(pendingReservation(102L));
        when(reservationCommandMapper.markReservationConfirmed(
                902L,
                LocalDateTime.of(2026, 4, 3, 12, 0),
                LocalDateTime.of(2026, 4, 3, 12, 0)
        )).thenReturn(1);

        ReservationDecisionResult result = reservationDecisionService.approveReservation(902L, adminActor());

        assertEquals(ReservationStatus.CONFIRMED, result.status());
        verify(reservationCommandMapper).insertReservationStatusHistory(any(ReservationStatusHistoryInsertParam.class));
    }

    @Test
    void approveReservationRejectsNonOwnerHost() {
        when(reservationQueryMapper.lockReservationDecisionTarget(902L)).thenReturn(pendingReservation(555L));

        AppException exception = assertThrows(
                AppException.class,
                () -> reservationDecisionService.approveReservation(902L, hostActor())
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
        verify(reservationCommandMapper, never()).markReservationConfirmed(any(), any(), any());
    }

    @Test
    void rejectReservationRejectsNonPendingState() {
        ReservationDecisionTargetRecord target = pendingReservation(102L);
        target.setStatus(ReservationStatus.CONFIRMED);
        when(reservationQueryMapper.lockReservationDecisionTarget(902L)).thenReturn(target);

        AppException exception = assertThrows(
                AppException.class,
                () -> reservationDecisionService.rejectReservation(902L, hostActor(), "Too late")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verify(reservationCommandMapper, never()).markReservationCancelled(any(), any(), any());
    }

    private ReservationDecisionTargetRecord pendingReservation(Long hostUserId) {
        ReservationDecisionTargetRecord record = new ReservationDecisionTargetRecord();
        record.setReservationId(902L);
        record.setReservationNo("GH-202604-0002");
        record.setGuestUserId(101L);
        record.setAccommodationId(501L);
        record.setRoomTypeId(1001L);
        record.setHostUserId(hostUserId);
        record.setStatus(ReservationStatus.PENDING);
        record.setRequestedAt(LocalDateTime.of(2026, 4, 2, 11, 0));
        return record;
    }

    private SessionUser hostActor() {
        return new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST);
    }

    private SessionUser adminActor() {
        return new SessionUser(999L, "admin.demo", "Admin Demo", UserRole.ADMIN);
    }

    private Long eqLong(Long value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }

    private String eqString(String value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }

    private LocalDateTime eqDateTime(LocalDateTime value) {
        return org.mockito.ArgumentMatchers.eq(value);
    }
}
