package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.PendingReservationSummaryRecord;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PendingReservationQueryService {

    private final ReservationQueryMapper reservationQueryMapper;

    public PendingReservationQueryService(ReservationQueryMapper reservationQueryMapper) {
        this.reservationQueryMapper = reservationQueryMapper;
    }

    public List<PendingReservationSummaryRecord> findPendingReservationsByHostUserId(Long hostUserId) {
        return reservationQueryMapper.findPendingReservationsByHostUserId(hostUserId);
    }
}
