package com.guesthouse.guestapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.GuestReservationCancellationTargetRecord;
import com.guesthouse.shared.db.reservation.model.ReservationStatusHistoryInsertParam;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Service
public class GuestReservationCancellationService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");
    private static final String CANCELLATION_BLOCKED_MESSAGE =
            "Cancellation is not allowed after the check-in time.";

    private final ReservationQueryMapper reservationQueryMapper;
    private final ReservationCommandMapper reservationCommandMapper;
    private final Clock clock;

    public GuestReservationCancellationService(
            ReservationQueryMapper reservationQueryMapper,
            ReservationCommandMapper reservationCommandMapper,
            Clock clock
    ) {
        this.reservationQueryMapper = reservationQueryMapper;
        this.reservationCommandMapper = reservationCommandMapper;
        this.clock = clock;
    }

    @Transactional
    public GuestReservationCancellationResult cancelReservation(Long guestUserId, Long reservationId) {
        GuestReservationCancellationTargetRecord target =
                reservationQueryMapper.lockReservationCancellationTargetByReservationIdAndGuestUserId(
                        reservationId,
                        guestUserId
                );
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation not found.");
        }
        if (!isCancellableStatus(target.getStatus())) {
            throw invalidTransition();
        }

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime cutoff = LocalDateTime.of(target.getCheckInDate(), target.getCheckInTime());
        if (!now.isBefore(cutoff)) {
            throw new AppException(ErrorCode.INVALID_REQUEST, HttpStatus.CONFLICT, CANCELLATION_BLOCKED_MESSAGE);
        }

        int updatedRows = reservationCommandMapper.markReservationCancelledByGuest(reservationId, now, now);
        if (updatedRows != 1) {
            throw invalidTransition();
        }

        reservationCommandMapper.insertReservationStatusHistory(
                buildHistory(reservationId, target.getStatus(), guestUserId, now)
        );

        return new GuestReservationCancellationResult(
                target.getReservationId(),
                target.getReservationNo(),
                ReservationStatus.CANCELLED,
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private boolean isCancellableStatus(ReservationStatus status) {
        return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
    }

    private ReservationStatusHistoryInsertParam buildHistory(
            Long reservationId,
            ReservationStatus fromStatus,
            Long guestUserId,
            LocalDateTime changedAt
    ) {
        ReservationStatusHistoryInsertParam history = new ReservationStatusHistoryInsertParam();
        history.setReservationId(reservationId);
        history.setFromStatus(fromStatus);
        history.setToStatus(ReservationStatus.CANCELLED);
        history.setActionType(ReservationActionType.GUEST_CANCELLED);
        history.setChangedByUserId(guestUserId);
        history.setReasonType("GUEST_CANCELLATION");
        history.setReasonText("Reservation cancelled by guest before check-in cutoff.");
        history.setChangedAt(changedAt);
        return history;
    }

    private AppException invalidTransition() {
        return new AppException(
                ErrorCode.INVALID_REQUEST,
                HttpStatus.CONFLICT,
                "Reservation cannot be cancelled in its current status."
        );
    }
}
