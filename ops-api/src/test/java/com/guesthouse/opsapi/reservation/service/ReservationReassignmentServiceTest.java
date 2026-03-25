package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.ActiveRoomInventoryRecord;
import com.guesthouse.shared.db.reservation.model.BlockedRoomRangeRecord;
import com.guesthouse.shared.db.reservation.model.OccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationMutationTargetRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationNightRecord;
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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationReassignmentServiceTest {

    @Mock
    private ReservationQueryMapper reservationQueryMapper;

    @Mock
    private ReservationInventoryMapper reservationInventoryMapper;

    @Mock
    private ReservationCommandMapper reservationCommandMapper;

    @Mock
    private OpsReservationAuditService opsReservationAuditService;

    private ReservationReassignmentService reservationReassignmentService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-04-14T00:00:00Z"), ZoneId.of("Asia/Seoul"));
        reservationReassignmentService = new ReservationReassignmentService(
                reservationQueryMapper,
                reservationInventoryMapper,
                reservationCommandMapper,
                opsReservationAuditService,
                fixedClock
        );
    }

    @Test
    void reassignReservationAllowsSameDayCrossRoomTypeMove() {
        when(reservationQueryMapper.lockOpsReservationMutationTarget(902L)).thenReturn(target(ReservationStatus.CONFIRMED));
        when(reservationQueryMapper.findOpsReservationNightsByReservationIds(List.of(902L)))
                .thenReturn(List.of(todayNight()));
        when(reservationInventoryMapper.lockActiveRoomsByAccommodation(501L)).thenReturn(List.of(
                room(7001L, "301", 1001L, "Standard Double"),
                room(7002L, "401", 1002L, "Deluxe Twin")
        ));
        when(reservationInventoryMapper.findActiveRoomBlocksForAccommodationStay(
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2026, 4, 15)
        )).thenReturn(List.of());
        when(reservationInventoryMapper.findOccupiedRoomNightsForAccommodationStay(
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2026, 4, 15)
        )).thenReturn(List.of(occupiedNight(7001L, LocalDate.of(2026, 4, 14))));

        ReservationReassignmentResult result = reservationReassignmentService.reassignReservation(
                902L,
                List.of(new ReservationReassignmentService.ReservationNightReassignmentChange(3001L, 7002L)),
                hostActor()
        );

        assertEquals(1, result.changedNightCount());
        verify(reservationCommandMapper).updateReservationNightAssignedRoom(
                3001L,
                7002L,
                LocalDateTime.of(2026, 4, 14, 9, 0)
        );
        verify(opsReservationAuditService).writeReservationAudit(
                any(SessionUser.class),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any()
        );
    }

    @Test
    void reassignReservationRejectsPastNight() {
        when(reservationQueryMapper.lockOpsReservationMutationTarget(902L)).thenReturn(target(ReservationStatus.CONFIRMED));
        when(reservationQueryMapper.findOpsReservationNightsByReservationIds(List.of(902L)))
                .thenReturn(List.of(pastNight()));
        when(reservationInventoryMapper.lockActiveRoomsByAccommodation(501L)).thenReturn(List.of(
                room(7001L, "301", 1001L, "Standard Double"),
                room(7002L, "302", 1001L, "Standard Double")
        ));
        when(reservationInventoryMapper.findActiveRoomBlocksForAccommodationStay(
                501L,
                LocalDate.of(2026, 4, 13),
                LocalDate.of(2026, 4, 14)
        )).thenReturn(List.of());
        when(reservationInventoryMapper.findOccupiedRoomNightsForAccommodationStay(
                501L,
                LocalDate.of(2026, 4, 13),
                LocalDate.of(2026, 4, 14)
        )).thenReturn(List.of(occupiedNight(7001L, LocalDate.of(2026, 4, 13))));

        AppException exception = assertThrows(
                AppException.class,
                () -> reservationReassignmentService.reassignReservation(
                        902L,
                        List.of(new ReservationReassignmentService.ReservationNightReassignmentChange(3000L, 7002L)),
                        hostActor()
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verify(reservationCommandMapper, never()).updateReservationNightAssignedRoom(any(), any(), any());
    }

    @Test
    void reassignReservationRejectsBlockedRoom() {
        when(reservationQueryMapper.lockOpsReservationMutationTarget(902L)).thenReturn(target(ReservationStatus.PENDING));
        when(reservationQueryMapper.findOpsReservationNightsByReservationIds(List.of(902L)))
                .thenReturn(List.of(todayNight()));
        when(reservationInventoryMapper.lockActiveRoomsByAccommodation(501L)).thenReturn(List.of(
                room(7001L, "301", 1001L, "Standard Double"),
                room(7002L, "302", 1001L, "Standard Double")
        ));
        when(reservationInventoryMapper.findActiveRoomBlocksForAccommodationStay(
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2026, 4, 15)
        )).thenReturn(List.of(blockedRange(7002L)));
        when(reservationInventoryMapper.findOccupiedRoomNightsForAccommodationStay(
                501L,
                LocalDate.of(2026, 4, 14),
                LocalDate.of(2026, 4, 15)
        )).thenReturn(List.of(occupiedNight(7001L, LocalDate.of(2026, 4, 14))));

        AppException exception = assertThrows(
                AppException.class,
                () -> reservationReassignmentService.reassignReservation(
                        902L,
                        List.of(new ReservationReassignmentService.ReservationNightReassignmentChange(3001L, 7002L)),
                        hostActor()
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("Selected room is blocked for that stay date.", exception.getMessage());
    }

    @Test
    void reassignReservationRejectsCancelledReservation() {
        when(reservationQueryMapper.lockOpsReservationMutationTarget(902L)).thenReturn(target(ReservationStatus.CANCELLED));

        AppException exception = assertThrows(
                AppException.class,
                () -> reservationReassignmentService.reassignReservation(
                        902L,
                        List.of(new ReservationReassignmentService.ReservationNightReassignmentChange(3001L, 7002L)),
                        hostActor()
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verify(reservationInventoryMapper, never()).lockActiveRoomsByAccommodation(any());
    }

    private OpsReservationMutationTargetRecord target(ReservationStatus status) {
        OpsReservationMutationTargetRecord record = new OpsReservationMutationTargetRecord();
        record.setReservationId(902L);
        record.setReservationNo("GH-202604-0002");
        record.setAccommodationId(501L);
        record.setRoomTypeId(1001L);
        record.setHostUserId(102L);
        record.setStatus(status);
        return record;
    }

    private OpsReservationNightRecord todayNight() {
        OpsReservationNightRecord record = new OpsReservationNightRecord();
        record.setReservationNightId(3001L);
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
        record.setReservationNightId(3000L);
        record.setReservationId(902L);
        record.setStayDate(LocalDate.of(2026, 4, 13));
        record.setAssignedRoomId(7001L);
        record.setAssignedRoomCode("301");
        record.setAssignedRoomTypeId(1001L);
        record.setAssignedRoomTypeName("Standard Double");
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

    private OccupiedRoomNightRecord occupiedNight(Long roomId, LocalDate stayDate) {
        OccupiedRoomNightRecord record = new OccupiedRoomNightRecord();
        record.setRoomId(roomId);
        record.setStayDate(stayDate);
        return record;
    }

    private BlockedRoomRangeRecord blockedRange(Long roomId) {
        BlockedRoomRangeRecord record = new BlockedRoomRangeRecord();
        record.setRoomId(roomId);
        record.setStartDate(LocalDate.of(2026, 4, 14));
        record.setEndDate(LocalDate.of(2026, 4, 14));
        return record;
    }

    private SessionUser hostActor() {
        return new SessionUser(102L, "host.demo", "Host Demo", UserRole.HOST);
    }
}
