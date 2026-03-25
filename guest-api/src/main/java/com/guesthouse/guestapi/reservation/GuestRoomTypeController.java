package com.guesthouse.guestapi.reservation;

import com.guesthouse.guestapi.reservation.api.RoomTypeOptionResponse;
import com.guesthouse.guestapi.reservation.service.RoomTypeCatalogService;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/room-types")
public class GuestRoomTypeController {

    private final RoomTypeCatalogService roomTypeCatalogService;

    public GuestRoomTypeController(RoomTypeCatalogService roomTypeCatalogService) {
        this.roomTypeCatalogService = roomTypeCatalogService;
    }

    @GetMapping
    @RequireRoles(UserRole.GUEST)
    public ApiResponse<List<RoomTypeOptionResponse>> findActiveRoomTypes() {
        return ApiResponse.success(
                roomTypeCatalogService.findActiveRoomTypeOptions()
                        .stream()
                        .map(RoomTypeOptionResponse::from)
                        .toList()
        );
    }
}
