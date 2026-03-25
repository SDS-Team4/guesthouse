package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationInventoryMapper;
import com.guesthouse.shared.db.reservation.model.BlockedRoomRangeRecord;
import com.guesthouse.shared.db.reservation.model.LockedRoomTypeRecord;
import com.guesthouse.shared.db.reservation.model.OccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.ReservationInsertParam;
import com.guesthouse.shared.db.reservation.model.ReservationNightInsertParam;
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
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationRequestServiceTest {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    @Mock
    private ReservationInventoryMapper reservationInventoryMapper;

    @Mock
    private ReservationCommandMapper reservationCommandMapper;

    private ReservationRequestService reservationRequestService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(Instant.parse("2026-04-01T01:00:00Z"), BUSINESS_ZONE_ID);
        reservationRequestService = new ReservationRequestService(
                reservationInventoryMapper,
                reservationCommandMapper,
                fixedClock
        );
    }

    @Test
    void createReservationCreatesPendingReservationNightsAndHistory() {
        LocalDate checkInDate = LocalDate.of(2026, 4, 12);
        LocalDate checkOutDate = LocalDate.of(2026, 4, 14);
        when(reservationInventoryMapper.lockActiveRoomType(1001L)).thenReturn(lockedRoomType());
        when(reservationInventoryMapper.lockActiveRoomIdsByRoomType(1001L)).thenReturn(List.of(2001L, 2002L));
        when(reservationInventoryMapper.findActiveRoomBlocksForStay(1001L, checkInDate, checkOutDate))
                .thenReturn(List.of(blockedRoom(2001L, checkInDate, checkInDate)));
        when(reservationInventoryMapper.findOccupiedRoomNightsForStay(1001L, checkInDate, checkOutDate))
                .thenReturn(List.of(occupiedNight(2002L, LocalDate.of(2026, 4, 13))));
        doAnswer(invocation -> {
            ReservationInsertParam param = invocation.getArgument(0);
            param.setReservationId(903L);
            return null;
        }).when(reservationCommandMapper).insertReservation(any(ReservationInsertParam.class));

        CreateReservationResult result = reservationRequestService.createReservation(
                new CreateReservationCommand(101L, 1001L, 2, checkInDate, checkOutDate)
        );

        ArgumentCaptor<ReservationInsertParam> reservationCaptor = ArgumentCaptor.forClass(ReservationInsertParam.class);
        ArgumentCaptor<List<ReservationNightInsertParam>> nightsCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<ReservationStatusHistoryInsertParam> historyCaptor =
                ArgumentCaptor.forClass(ReservationStatusHistoryInsertParam.class);

        verify(reservationCommandMapper).insertReservation(reservationCaptor.capture());
        verify(reservationCommandMapper).insertReservationNights(nightsCaptor.capture());
        verify(reservationCommandMapper).insertReservationStatusHistory(historyCaptor.capture());

        ReservationInsertParam reservation = reservationCaptor.getValue();
        assertEquals(903L, result.reservationId());
        assertEquals(ReservationStatus.PENDING, result.status());
        assertEquals(ReservationStatus.PENDING, reservation.getStatus());
        assertEquals(101L, reservation.getGuestUserId());
        assertEquals(501L, reservation.getAccommodationId());
        assertEquals(2, reservation.getGuestCount());

        List<ReservationNightInsertParam> nights = nightsCaptor.getValue();
        assertEquals(2, nights.size());
        assertEquals(LocalDate.of(2026, 4, 12), nights.get(0).getStayDate());
        assertEquals(2002L, nights.get(0).getAssignedRoomId());
        assertEquals(LocalDate.of(2026, 4, 13), nights.get(1).getStayDate());
        assertEquals(2001L, nights.get(1).getAssignedRoomId());

        ReservationStatusHistoryInsertParam history = historyCaptor.getValue();
        assertEquals(903L, history.getReservationId());
        assertEquals(ReservationActionType.REQUESTED, history.getActionType());
        assertEquals(ReservationStatus.PENDING, history.getToStatus());
        assertEquals(101L, history.getChangedByUserId());
    }

    @Test
    void createReservationFailsSafelyWhenNoInventoryIsAvailable() {
        LocalDate checkInDate = LocalDate.of(2026, 4, 12);
        LocalDate checkOutDate = LocalDate.of(2026, 4, 13);
        when(reservationInventoryMapper.lockActiveRoomType(1001L)).thenReturn(lockedRoomType());
        when(reservationInventoryMapper.lockActiveRoomIdsByRoomType(1001L)).thenReturn(List.of(2001L, 2002L));
        when(reservationInventoryMapper.findActiveRoomBlocksForStay(1001L, checkInDate, checkOutDate))
                .thenReturn(List.of());
        when(reservationInventoryMapper.findOccupiedRoomNightsForStay(1001L, checkInDate, checkOutDate))
                .thenReturn(List.of(
                        occupiedNight(2001L, checkInDate),
                        occupiedNight(2002L, checkInDate)
                ));

        AppException exception = assertThrows(
                AppException.class,
                () -> reservationRequestService.createReservation(
                        new CreateReservationCommand(101L, 1001L, 2, checkInDate, checkOutDate)
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(ErrorCode.INVENTORY_UNAVAILABLE, exception.getErrorCode());
        verify(reservationCommandMapper, never()).insertReservation(any(ReservationInsertParam.class));
        verify(reservationCommandMapper, never()).insertReservationNights(any());
        verify(reservationCommandMapper, never()).insertReservationStatusHistory(any(ReservationStatusHistoryInsertParam.class));
    }

    @Test
    void createReservationRejectsInvalidStayDateRules() {
        AppException exception = assertThrows(
                AppException.class,
                () -> reservationRequestService.createReservation(
                        new CreateReservationCommand(
                                101L,
                                1001L,
                                2,
                                LocalDate.of(2026, 3, 31),
                                LocalDate.of(2026, 3, 31)
                        )
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorCode.INVALID_REQUEST, exception.getErrorCode());
        verify(reservationInventoryMapper, never()).lockActiveRoomType(eq(1001L));
    }

    private LockedRoomTypeRecord lockedRoomType() {
        LockedRoomTypeRecord record = new LockedRoomTypeRecord();
        record.setRoomTypeId(1001L);
        record.setAccommodationId(501L);
        record.setRoomTypeName("스탠다드 더블");
        record.setMaxCapacity(2);
        return record;
    }

    private BlockedRoomRangeRecord blockedRoom(Long roomId, LocalDate startDate, LocalDate endDate) {
        BlockedRoomRangeRecord record = new BlockedRoomRangeRecord();
        record.setRoomId(roomId);
        record.setStartDate(startDate);
        record.setEndDate(endDate);
        return record;
    }

    private OccupiedRoomNightRecord occupiedNight(Long roomId, LocalDate stayDate) {
        OccupiedRoomNightRecord record = new OccupiedRoomNightRecord();
        record.setRoomId(roomId);
        record.setStayDate(stayDate);
        return record;
    }
}
