package com.guesthouse.opsapi.reservation;

import com.guesthouse.opsapi.reservation.api.OpsReservationDetailResponse;
import com.guesthouse.opsapi.reservation.api.OpsReservationSummaryResponse;
import com.guesthouse.opsapi.reservation.api.RejectReservationRequest;
import com.guesthouse.opsapi.reservation.api.ReassignReservationRequest;
import com.guesthouse.opsapi.reservation.api.ReservationDecisionResponse;
import com.guesthouse.opsapi.reservation.api.ReservationReassignmentResponse;
import com.guesthouse.opsapi.reservation.service.OpsReservationQueryService;
import com.guesthouse.opsapi.reservation.service.ReservationDecisionResult;
import com.guesthouse.opsapi.reservation.service.ReservationDecisionService;
import com.guesthouse.opsapi.reservation.service.ReservationReassignmentService;
import com.guesthouse.shared.auth.session.CurrentSessionUser;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.reservation.ReservationStatus;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
public class OpsReservationController {

    private final OpsReservationQueryService opsReservationQueryService;
    private final ReservationDecisionService reservationDecisionService;
    private final ReservationReassignmentService reservationReassignmentService;

    public OpsReservationController(
            OpsReservationQueryService opsReservationQueryService,
            ReservationDecisionService reservationDecisionService,
            ReservationReassignmentService reservationReassignmentService
    ) {
        this.opsReservationQueryService = opsReservationQueryService;
        this.reservationDecisionService = reservationDecisionService;
        this.reservationReassignmentService = reservationReassignmentService;
    }

    @GetMapping
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<List<OpsReservationSummaryResponse>> findReservations(
            @CurrentSessionUser SessionUser sessionUser,
            @RequestParam(required = false) ReservationStatus status
    ) {
        return ApiResponse.success(
                opsReservationQueryService.findReservations(sessionUser, status)
                        .stream()
                        .map(OpsReservationSummaryResponse::from)
                        .toList()
        );
    }

    @GetMapping("/pending")
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<List<OpsReservationSummaryResponse>> findPendingReservations(
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(
                opsReservationQueryService.findReservations(sessionUser, ReservationStatus.PENDING)
                        .stream()
                        .map(OpsReservationSummaryResponse::from)
                        .toList()
        );
    }

    @GetMapping("/{reservationId}")
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<OpsReservationDetailResponse> findReservationDetail(
            @PathVariable Long reservationId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(
                OpsReservationDetailResponse.from(
                        opsReservationQueryService.getReservationDetail(reservationId, sessionUser)
                )
        );
    }

    @PostMapping("/{reservationId}/approve")
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<ReservationDecisionResponse> approveReservation(
            @PathVariable Long reservationId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(toDecisionResponse(
                reservationDecisionService.approveReservation(reservationId, sessionUser)
        ));
    }

    @PostMapping("/{reservationId}/reject")
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<ReservationDecisionResponse> rejectReservation(
            @PathVariable Long reservationId,
            @CurrentSessionUser SessionUser sessionUser,
            @RequestBody(required = false) RejectReservationRequest rejectReservationRequest
    ) {
        String reasonText = rejectReservationRequest == null ? null : rejectReservationRequest.reasonText();
        return ApiResponse.success(toDecisionResponse(
                reservationDecisionService.rejectReservation(reservationId, sessionUser, reasonText)
        ));
    }

    @PostMapping("/{reservationId}/reassign")
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<ReservationReassignmentResponse> reassignReservation(
            @PathVariable Long reservationId,
            @CurrentSessionUser SessionUser sessionUser,
            @RequestBody ReassignReservationRequest reassignReservationRequest
    ) {
        List<ReservationReassignmentService.ReservationNightReassignmentChange> changes =
                reassignReservationRequest == null || reassignReservationRequest.changes() == null
                        ? List.of()
                        : reassignReservationRequest.changes().stream()
                        .map(change -> new ReservationReassignmentService.ReservationNightReassignmentChange(
                                change.reservationNightId(),
                                change.assignedRoomId()
                        ))
                        .toList();
        return ApiResponse.success(
                ReservationReassignmentResponse.from(
                        reservationReassignmentService.reassignReservation(reservationId, changes, sessionUser)
                )
        );
    }

    private ReservationDecisionResponse toDecisionResponse(ReservationDecisionResult result) {
        return new ReservationDecisionResponse(
                result.reservationId(),
                result.reservationNo(),
                result.status(),
                result.changedAt()
        );
    }
}
