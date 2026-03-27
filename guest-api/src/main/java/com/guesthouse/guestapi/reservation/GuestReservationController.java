package com.guesthouse.guestapi.reservation;

import com.guesthouse.guestapi.reservation.api.CreateReservationRequest;
import com.guesthouse.guestapi.reservation.api.CreateReservationResponse;
import com.guesthouse.guestapi.reservation.api.GuestReservationCancellationResponse;
import com.guesthouse.guestapi.reservation.api.GuestReservationDetailResponse;
import com.guesthouse.guestapi.reservation.api.GuestReservationSummaryResponse;
import com.guesthouse.guestapi.reservation.service.CreateReservationCommand;
import com.guesthouse.guestapi.reservation.service.GuestReservationCancellationService;
import com.guesthouse.guestapi.reservation.service.GuestReservationQueryService;
import com.guesthouse.guestapi.reservation.service.ReservationRequestService;
import com.guesthouse.shared.auth.session.CurrentSessionUser;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.user.UserRole;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
public class GuestReservationController {

    private final ReservationRequestService reservationRequestService;
    private final GuestReservationQueryService guestReservationQueryService;
    private final GuestReservationCancellationService guestReservationCancellationService;

    public GuestReservationController(
            ReservationRequestService reservationRequestService,
            GuestReservationQueryService guestReservationQueryService,
            GuestReservationCancellationService guestReservationCancellationService
    ) {
        this.reservationRequestService = reservationRequestService;
        this.guestReservationQueryService = guestReservationQueryService;
        this.guestReservationCancellationService = guestReservationCancellationService;
    }

    @PostMapping
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<CreateReservationResponse> createReservation(
            @CurrentSessionUser SessionUser sessionUser,
            @Valid @RequestBody CreateReservationRequest createReservationRequest
    ) {
        return ApiResponse.success(
                CreateReservationResponse.from(
                        reservationRequestService.createReservation(
                                new CreateReservationCommand(
                                        sessionUser.userId(),
                                        createReservationRequest.roomTypeId(),
                                        createReservationRequest.guestCount(),
                                        createReservationRequest.checkInDate(),
                                        createReservationRequest.checkOutDate()
                                )
                        )
                )
        );
    }

    @GetMapping("/my")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<List<GuestReservationSummaryResponse>> findMyReservations(
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(
                guestReservationQueryService.findReservationsByGuestUserId(sessionUser.userId())
                        .stream()
                        .map(GuestReservationSummaryResponse::from)
                        .toList()
        );
    }

    @GetMapping("/{reservationId:\\d+}")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<GuestReservationDetailResponse> findMyReservationDetail(
            @CurrentSessionUser SessionUser sessionUser,
            @PathVariable Long reservationId
    ) {
        return ApiResponse.success(
                GuestReservationDetailResponse.from(
                        guestReservationQueryService.findReservationDetailByReservationId(
                                sessionUser.userId(),
                                reservationId
                        )
                )
        );
    }

    @PostMapping("/{reservationId:\\d+}/cancel")
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<GuestReservationCancellationResponse> cancelMyReservation(
            @CurrentSessionUser SessionUser sessionUser,
            @PathVariable Long reservationId
    ) {
        return ApiResponse.success(
                GuestReservationCancellationResponse.from(
                        guestReservationCancellationService.cancelReservation(
                                sessionUser.userId(),
                                reservationId
                        )
                )
        );
    }
}
