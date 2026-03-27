package com.guesthouse.opsapi.hostasset;

import com.guesthouse.opsapi.hostasset.api.HostAccommodationDetailResponse;
import com.guesthouse.opsapi.hostasset.api.HostAccommodationFormRequest;
import com.guesthouse.opsapi.hostasset.api.HostAccommodationSummaryResponse;
import com.guesthouse.opsapi.hostasset.api.HostAssetMutationResponse;
import com.guesthouse.opsapi.hostasset.api.HostRoomCreateRequest;
import com.guesthouse.opsapi.hostasset.api.HostRoomTypeFormRequest;
import com.guesthouse.opsapi.hostasset.api.HostRoomUpdateRequest;
import com.guesthouse.opsapi.hostasset.service.HostAssetService;
import com.guesthouse.shared.auth.session.CurrentSessionUser;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.user.UserRole;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/host")
@RequireRoles(UserRole.HOST)
public class HostAssetController {

    private final HostAssetService hostAssetService;

    public HostAssetController(HostAssetService hostAssetService) {
        this.hostAssetService = hostAssetService;
    }

    @GetMapping("/accommodations")
    public ApiResponse<List<HostAccommodationSummaryResponse>> findAccommodations(
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(
                hostAssetService.findAccommodations(sessionUser).stream()
                        .map(HostAccommodationSummaryResponse::from)
                        .toList()
        );
    }

    @GetMapping("/accommodations/{accommodationId}")
    public ApiResponse<HostAccommodationDetailResponse> getAccommodationDetail(
            @PathVariable Long accommodationId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        HostAssetService.HostAccommodationDetailBundle bundle = hostAssetService.getAccommodationDetail(accommodationId, sessionUser);
        return ApiResponse.success(
                HostAccommodationDetailResponse.from(bundle.detail(), bundle.roomTypes(), bundle.rooms())
        );
    }

    @PostMapping("/accommodations")
    public ApiResponse<HostAssetMutationResponse> createAccommodation(
            @Valid @RequestBody HostAccommodationFormRequest request,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.createAccommodation(request, sessionUser)));
    }

    @PutMapping("/accommodations/{accommodationId}")
    public ApiResponse<HostAssetMutationResponse> updateAccommodation(
            @PathVariable Long accommodationId,
            @Valid @RequestBody HostAccommodationFormRequest request,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.updateAccommodation(accommodationId, request, sessionUser)));
    }

    @PostMapping("/accommodations/{accommodationId}/deactivate")
    public ApiResponse<HostAssetMutationResponse> deactivateAccommodation(
            @PathVariable Long accommodationId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.deactivateAccommodation(accommodationId, sessionUser)));
    }

    @PostMapping("/accommodations/{accommodationId}/room-types")
    public ApiResponse<HostAssetMutationResponse> createRoomType(
            @PathVariable Long accommodationId,
            @Valid @RequestBody HostRoomTypeFormRequest request,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.createRoomType(accommodationId, request, sessionUser)));
    }

    @PutMapping("/room-types/{roomTypeId}")
    public ApiResponse<HostAssetMutationResponse> updateRoomType(
            @PathVariable Long roomTypeId,
            @Valid @RequestBody HostRoomTypeFormRequest request,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.updateRoomType(roomTypeId, request, sessionUser)));
    }

    @PostMapping("/room-types/{roomTypeId}/deactivate")
    public ApiResponse<HostAssetMutationResponse> deactivateRoomType(
            @PathVariable Long roomTypeId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.deactivateRoomType(roomTypeId, sessionUser)));
    }

    @PostMapping("/accommodations/{accommodationId}/rooms")
    public ApiResponse<HostAssetMutationResponse> createRoom(
            @PathVariable Long accommodationId,
            @Valid @RequestBody HostRoomCreateRequest request,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.createRoom(accommodationId, request, sessionUser)));
    }

    @PutMapping("/rooms/{roomId}")
    public ApiResponse<HostAssetMutationResponse> updateRoom(
            @PathVariable Long roomId,
            @Valid @RequestBody HostRoomUpdateRequest request,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.updateRoom(roomId, request, sessionUser)));
    }

    @PostMapping("/rooms/{roomId}/deactivate")
    public ApiResponse<HostAssetMutationResponse> deactivateRoom(
            @PathVariable Long roomId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(HostAssetMutationResponse.from(hostAssetService.deactivateRoom(roomId, sessionUser)));
    }
}
