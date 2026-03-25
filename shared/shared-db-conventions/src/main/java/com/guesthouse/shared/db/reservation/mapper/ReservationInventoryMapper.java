package com.guesthouse.shared.db.reservation.mapper;

import com.guesthouse.shared.db.reservation.model.BlockedRoomRangeRecord;
import com.guesthouse.shared.db.reservation.model.ActiveRoomInventoryRecord;
import com.guesthouse.shared.db.reservation.model.LockedRoomTypeRecord;
import com.guesthouse.shared.db.reservation.model.OccupiedRoomNightRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface ReservationInventoryMapper {

    LockedRoomTypeRecord lockActiveRoomType(@Param("roomTypeId") Long roomTypeId);

    List<Long> lockActiveRoomIdsByRoomType(@Param("roomTypeId") Long roomTypeId);

    List<ActiveRoomInventoryRecord> lockActiveRoomsByAccommodation(@Param("accommodationId") Long accommodationId);

    List<BlockedRoomRangeRecord> findActiveRoomBlocksForStay(
            @Param("roomTypeId") Long roomTypeId,
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate
    );

    List<BlockedRoomRangeRecord> findActiveRoomBlocksForAccommodationStay(
            @Param("accommodationId") Long accommodationId,
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate
    );

    List<OccupiedRoomNightRecord> findOccupiedRoomNightsForStay(
            @Param("roomTypeId") Long roomTypeId,
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate
    );

    List<OccupiedRoomNightRecord> findOccupiedRoomNightsForAccommodationStay(
            @Param("accommodationId") Long accommodationId,
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate
    );
}
