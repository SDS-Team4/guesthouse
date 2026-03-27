package com.guesthouse.opsapi.reservation.service;

import com.guesthouse.shared.db.reservation.mapper.ReservationCommandMapper;
import com.guesthouse.shared.db.reservation.mapper.ReservationQueryMapper;
import com.guesthouse.shared.db.reservation.model.ReservationDecisionTargetRecord;
import com.guesthouse.shared.db.reservation.model.OpsReservationMutationTargetRecord;
import com.guesthouse.shared.db.reservation.model.ReservationStatusHistoryInsertParam;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.reservation.ReservationActionType;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ReservationDecisionService {

    private static final ZoneId BUSINESS_ZONE_ID = ZoneId.of("Asia/Seoul");

    private final ReservationQueryMapper reservationQueryMapper;
    private final ReservationCommandMapper reservationCommandMapper;
    private final OpsReservationAuditService opsReservationAuditService;
    private final Clock clock;

    public ReservationDecisionService(
            ReservationQueryMapper reservationQueryMapper,
            ReservationCommandMapper reservationCommandMapper,
            OpsReservationAuditService opsReservationAuditService,
            Clock clock
    ) {
        this.reservationQueryMapper = reservationQueryMapper;
        this.reservationCommandMapper = reservationCommandMapper;
        this.opsReservationAuditService = opsReservationAuditService;
        this.clock = clock;
    }

    @Transactional
    public ReservationDecisionResult approveReservation(Long reservationId, SessionUser actor) {
        ReservationDecisionTargetRecord target = lockOwnedPendingReservation(reservationId, actor);
        LocalDateTime now = LocalDateTime.now(clock);
        int updatedRows = reservationCommandMapper.markReservationConfirmed(reservationId, now, now);
        if (updatedRows != 1) {
            throw reservationStateConflict();
        }

        reservationCommandMapper.insertReservationStatusHistory(
                buildHistory(
                        reservationId,
                        ReservationStatus.PENDING,
                        ReservationStatus.CONFIRMED,
                        ReservationActionType.HOST_CONFIRMED,
                        actor.userId(),
                        actor.role() == UserRole.ADMIN ? "ADMIN_APPROVAL" : "HOST_APPROVAL",
                        actor.role() == UserRole.ADMIN
                                ? "Reservation approved by admin."
                                : "Reservation approved by host.",
                        now
                )
        );

        opsReservationAuditService.writeReservationAudit(
                actor,
                reservationId,
                "RESERVATION_APPROVED",
                actor.role() == UserRole.ADMIN ? "ADMIN_APPROVAL" : "HOST_APPROVAL",
                "Reservation approved by operations.",
                Map.of("status", ReservationStatus.PENDING.name()),
                Map.of("status", ReservationStatus.CONFIRMED.name()),
                now
        );

        return new ReservationDecisionResult(
                target.getReservationId(),
                target.getReservationNo(),
                ReservationStatus.CONFIRMED,
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    @Transactional
    public ReservationDecisionResult rejectReservation(Long reservationId, SessionUser actor, String reasonText) {
        ReservationDecisionTargetRecord target = lockOwnedPendingReservation(reservationId, actor);
        LocalDateTime now = LocalDateTime.now(clock);
        int updatedRows = reservationCommandMapper.markReservationCancelled(reservationId, now, now);
        if (updatedRows != 1) {
            throw reservationStateConflict();
        }

        String normalizedReasonText = (reasonText == null || reasonText.isBlank())
                ? actor.role() == UserRole.ADMIN
                    ? "Reservation rejected by admin."
                    : "Reservation rejected by host."
                : reasonText.trim();

        reservationCommandMapper.insertReservationStatusHistory(
                buildHistory(
                        reservationId,
                        ReservationStatus.PENDING,
                        ReservationStatus.CANCELLED,
                        ReservationActionType.HOST_REJECTED,
                        actor.userId(),
                        actor.role() == UserRole.ADMIN ? "ADMIN_REJECTION" : "HOST_REJECTION",
                        normalizedReasonText,
                        now
                )
        );

        Map<String, Object> afterState = new LinkedHashMap<>();
        afterState.put("status", ReservationStatus.CANCELLED.name());
        afterState.put("reasonText", normalizedReasonText);
        opsReservationAuditService.writeReservationAudit(
                actor,
                reservationId,
                "RESERVATION_REJECTED",
                actor.role() == UserRole.ADMIN ? "ADMIN_REJECTION" : "HOST_REJECTION",
                normalizedReasonText,
                Map.of("status", ReservationStatus.PENDING.name()),
                afterState,
                now
        );

        return new ReservationDecisionResult(
                target.getReservationId(),
                target.getReservationNo(),
                ReservationStatus.CANCELLED,
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    @Transactional
    public ReservationDecisionResult cancelReservation(Long reservationId, SessionUser actor, String reasonText) {
        OpsReservationMutationTargetRecord target = reservationQueryMapper.lockOpsReservationMutationTarget(reservationId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation not found.");
        }
        if (actor.role() != UserRole.ADMIN && !actor.userId().equals(target.getHostUserId())) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
        if (target.getStatus() != ReservationStatus.PENDING && target.getStatus() != ReservationStatus.CONFIRMED) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Reservation cannot be cancelled in its current status."
            );
        }

        LocalDateTime now = LocalDateTime.now(clock);
        int updatedRows = reservationCommandMapper.markReservationCancelledFromOperations(reservationId, now, now);
        if (updatedRows != 1) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.CONFLICT,
                    "Reservation cannot be cancelled in its current status."
            );
        }

        String normalizedReasonText = normalizeCancellationReason(reasonText, actor.role());
        ReservationActionType actionType = actor.role() == UserRole.ADMIN
                ? ReservationActionType.ADMIN_CANCELLED
                : ReservationActionType.HOST_CANCELLED;
        String reasonType = actor.role() == UserRole.ADMIN ? "ADMIN_CANCELLATION" : "HOST_CANCELLATION";

        reservationCommandMapper.insertReservationStatusHistory(
                buildHistory(
                        reservationId,
                        target.getStatus(),
                        ReservationStatus.CANCELLED,
                        actionType,
                        actor.userId(),
                        reasonType,
                        normalizedReasonText,
                        now
                )
        );

        Map<String, Object> afterState = new LinkedHashMap<>();
        afterState.put("status", ReservationStatus.CANCELLED.name());
        afterState.put("reasonText", normalizedReasonText);
        opsReservationAuditService.writeReservationAudit(
                actor,
                reservationId,
                actor.role() == UserRole.ADMIN ? "RESERVATION_CANCELLED_BY_ADMIN" : "RESERVATION_CANCELLED_BY_HOST",
                reasonType,
                normalizedReasonText,
                Map.of("status", target.getStatus().name()),
                afterState,
                now
        );

        return new ReservationDecisionResult(
                target.getReservationId(),
                target.getReservationNo(),
                ReservationStatus.CANCELLED,
                now.atZone(BUSINESS_ZONE_ID).toOffsetDateTime()
        );
    }

    private ReservationDecisionTargetRecord lockOwnedPendingReservation(Long reservationId, SessionUser actor) {
        ReservationDecisionTargetRecord target = reservationQueryMapper.lockReservationDecisionTarget(reservationId);
        if (target == null) {
            throw new AppException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Reservation not found.");
        }
        if (actor.role() != UserRole.ADMIN && !actor.userId().equals(target.getHostUserId())) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
        if (target.getStatus() != ReservationStatus.PENDING) {
            throw reservationStateConflict();
        }
        return target;
    }

    private ReservationStatusHistoryInsertParam buildHistory(
            Long reservationId,
            ReservationStatus fromStatus,
            ReservationStatus toStatus,
            ReservationActionType actionType,
            Long actorUserId,
            String reasonType,
            String reasonText,
            LocalDateTime changedAt
    ) {
        ReservationStatusHistoryInsertParam history = new ReservationStatusHistoryInsertParam();
        history.setReservationId(reservationId);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setActionType(actionType);
        history.setChangedByUserId(actorUserId);
        history.setReasonType(reasonType);
        history.setReasonText(reasonText);
        history.setChangedAt(changedAt);
        return history;
    }

    private AppException reservationStateConflict() {
        return new AppException(
                ErrorCode.INVALID_REQUEST,
                HttpStatus.CONFLICT,
                "Reservation is no longer pending."
        );
    }

    private String normalizeCancellationReason(String reasonText, UserRole role) {
        if (reasonText == null || reasonText.isBlank()) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    HttpStatus.BAD_REQUEST,
                    "A cancellation reason is required."
            );
        }
        String normalized = reasonText.trim();
        return normalized.isEmpty()
                ? role == UserRole.ADMIN ? "Reservation cancelled by admin." : "Reservation cancelled by host."
                : normalized;
    }
}
