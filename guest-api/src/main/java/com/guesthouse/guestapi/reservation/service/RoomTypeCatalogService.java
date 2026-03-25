package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.ActiveRoomTypeOptionRecord;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomTypeCatalogService {

    private final ReservationQueryMapper reservationQueryMapper;

    public RoomTypeCatalogService(ReservationQueryMapper reservationQueryMapper) {
        this.reservationQueryMapper = reservationQueryMapper;
    }

    public List<ActiveRoomTypeOptionRecord> findActiveRoomTypeOptions() {
        return reservationQueryMapper.findActiveRoomTypeOptions();
    }
}
