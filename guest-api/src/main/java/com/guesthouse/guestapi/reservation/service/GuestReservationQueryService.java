package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.GuestReservationDetailRecord;
import com.guesthouse.shared.db.reservation.model.GuestReservationSummaryRecord;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class GuestReservationQueryService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final ReservationQueryMapper reservationQueryMapper;
    private final Clock clock;

    public GuestReservationQueryService(ReservationQueryMapper reservationQueryMapper, Clock clock) {
        this.reservationQueryMapper = reservationQueryMapper;
        this.clock = clock;
    }

    public List<GuestReservationSummaryRecord> findReservationsByGuestUserId(Long guestUserId) {
        return reservationQueryMapper.findReservationsByGuestUserId(guestUserId);
    }

    public GuestReservationDetailView findReservationDetailByReservationId(Long guestUserId, Long reservationId) {
        GuestReservationDetailRecord reservationDetail =
                reservationQueryMapper.findReservationDetailByReservationIdAndGuestUserId(reservationId, guestUserId);
        if (reservationDetail == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation not found.");
        }

        LocalDateTime cancellationCutoff = LocalDateTime.of(
                reservationDetail.getCheckInDate(),
                reservationDetail.getAccommodationCheckInTime()
        );
        LocalDateTime now = LocalDateTime.now(clock);
        boolean cancellationAllowed = isCancellationEligibleStatus(reservationDetail.getStatus())
                && now.isBefore(cancellationCutoff);

        return new GuestReservationDetailView(
                reservationDetail,
                reservationQueryMapper.findReservationNightsByReservationId(reservationId),
                reservationQueryMapper.findReservationStatusHistoryByReservationId(reservationId),
                cancellationCutoff.atZone(BUSINESS_ZONE_ID).toOffsetDateTime(),
                cancellationAllowed,
                buildCancellationBlockedReason(reservationDetail.getStatus(), cancellationAllowed, now, cancellationCutoff)
        );
    }

    private boolean isCancellationEligibleStatus(ReservationStatus status) {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }

    private String buildCancellationBlockedReason(
            ReservationStatus status,
            boolean cancellationAllowed,
            LocalDateTime now,
            LocalDateTime cancellationCutoff
    ) {
        if (cancellationAllowed) {
            return null;
        }
        if (!isCancellationEligibleStatus(status)) {
            return "Reservation cannot be cancelled in its current status.";
        }
        if (!now.isBefore(cancellationCutoff)) {
            return "Cancellation is not allowed after the check-in time.";
        }
        return "Cancellation is not available for this reservation.";
    }
}
