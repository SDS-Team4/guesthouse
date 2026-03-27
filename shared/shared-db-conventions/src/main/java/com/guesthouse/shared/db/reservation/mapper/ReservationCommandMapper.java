package com.guesthouse.shared.db.reservation.mapper;

import com.guesthouse.shared.db.reservation.model.ReservationInsertParam;
import com.guesthouse.shared.db.reservation.model.ReservationNightInsertParam;
import com.guesthouse.shared.db.reservation.model.ReservationStatusHistoryInsertParam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ReservationCommandMapper {

    void insertReservation(ReservationInsertParam reservationInsertParam);

    void insertReservationNights(@Param("nights") List<ReservationNightInsertParam> nights);

    void insertReservationStatusHistory(ReservationStatusHistoryInsertParam reservationStatusHistoryInsertParam);

    int markReservationConfirmed(
            @Param("reservationId") Long reservationId,
            @Param("confirmedAt") LocalDateTime confirmedAt,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int markReservationCancelled(
            @Param("reservationId") Long reservationId,
            @Param("cancelledAt") LocalDateTime cancelledAt,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int markReservationCancelledByGuest(
            @Param("reservationId") Long reservationId,
            @Param("cancelledAt") LocalDateTime cancelledAt,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int markReservationCancelledFromOperations(
            @Param("reservationId") Long reservationId,
            @Param("cancelledAt") LocalDateTime cancelledAt,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int updateReservationNightAssignedRoom(
            @Param("reservationNightId") Long reservationNightId,
            @Param("assignedRoomId") Long assignedRoomId,
            @Param("updatedAt") LocalDateTime updatedAt
    );

    int touchReservationUpdatedAt(
            @Param("reservationId") Long reservationId,
            @Param("updatedAt") LocalDateTime updatedAt
    );
}
