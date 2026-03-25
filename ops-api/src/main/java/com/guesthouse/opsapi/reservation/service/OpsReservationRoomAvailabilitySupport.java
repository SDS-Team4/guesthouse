package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.AccommodationOccupiedRoomNightRecord;
import com.guesthouse.shared.db.reservation.model.ActiveRoomInventoryRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationBlockContextRecord;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class OpsReservationRoomAvailabilitySupport {

    private final ReservationQueryMapper reservationQueryMapper;

    public OpsReservationRoomAvailabilitySupport(ReservationQueryMapper reservationQueryMapper) {
        this.reservationQueryMapper = reservationQueryMapper;
    }

    public Map<Long, ActiveRoomInventoryRecord> loadActiveRoomsById(Long accommodationId) {
        Map<Long, ActiveRoomInventoryRecord> roomsById = new LinkedHashMap<>();
        for (ActiveRoomInventoryRecord room : reservationQueryMapper.findActiveRoomsByAccommodationId(accommodationId)) {
            roomsById.put(room.getRoomId(), room);
        }
        return roomsById;
    }

    public Map<LocalDate, Set<Long>> buildBlockedRoomsByDate(
            List<OpsReservationBlockContextRecord> blockContexts,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Map<LocalDate, Set<Long>> blockedRoomsByDate = new HashMap<>();
        for (OpsReservationBlockContextRecord blockContext : blockContexts) {
            LocalDate cursor = blockContext.getStartDate().isBefore(startDate)
                    ? startDate
                    : blockContext.getStartDate();
            while (cursor.isBefore(endDate) && !cursor.isAfter(blockContext.getEndDate())) {
                blockedRoomsByDate
                        .computeIfAbsent(cursor, ignored -> new LinkedHashSet<>())
                        .add(blockContext.getRoomId());
                cursor = cursor.plusDays(1);
            }
        }
        return blockedRoomsByDate;
    }

    public Map<LocalDate, Set<Long>> buildOccupiedRoomsByDate(
            List<AccommodationOccupiedRoomNightRecord> occupiedRoomNightRecords
    ) {
        Map<LocalDate, Set<Long>> occupiedRoomsByDate = new HashMap<>();
        for (AccommodationOccupiedRoomNightRecord occupiedRoomNightRecord : occupiedRoomNightRecords) {
            occupiedRoomsByDate
                    .computeIfAbsent(occupiedRoomNightRecord.getStayDate(), ignored -> new LinkedHashSet<>())
                    .add(occupiedRoomNightRecord.getRoomId());
        }
        return occupiedRoomsByDate;
    }
}
