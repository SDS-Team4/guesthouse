package com.guesthouse.opsapi.roomblock;

import com.guesthouse.opsapi.roomblock.api.CreateRoomBlockRequest;
import com.guesthouse.opsapi.roomblock.api.OpsRoomBlockManagementResponse;
import com.guesthouse.opsapi.roomblock.api.RoomBlockMutationResponse;
import com.guesthouse.opsapi.roomblock.service.OpsRoomBlockCommandService;
import com.guesthouse.opsapi.roomblock.service.OpsRoomBlockQueryService;
import com.guesthouse.shared.auth.session.CurrentSessionUser;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.auth.session.SessionUser;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/room-blocks")
public class OpsRoomBlockController {

    private final OpsRoomBlockQueryService opsRoomBlockQueryService;
    private final OpsRoomBlockCommandService opsRoomBlockCommandService;

    public OpsRoomBlockController(
            OpsRoomBlockQueryService opsRoomBlockQueryService,
            OpsRoomBlockCommandService opsRoomBlockCommandService
    ) {
        this.opsRoomBlockQueryService = opsRoomBlockQueryService;
        this.opsRoomBlockCommandService = opsRoomBlockCommandService;
    }

    @GetMapping
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<OpsRoomBlockManagementResponse> findRoomBlocks(
            @CurrentSessionUser SessionUser sessionUser,
            @RequestParam(required = false) Long accommodationId,
            @RequestParam(required = false) Long roomId
    ) {
        return ApiResponse.success(
                OpsRoomBlockManagementResponse.from(
                        opsRoomBlockQueryService.getRoomBlockManagementView(sessionUser, accommodationId, roomId)
                )
        );
    }

    @PostMapping
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<RoomBlockMutationResponse> createRoomBlock(
            @CurrentSessionUser SessionUser sessionUser,
            @RequestBody CreateRoomBlockRequest createRoomBlockRequest
    ) {
        return ApiResponse.success(
                RoomBlockMutationResponse.from(
                        opsRoomBlockCommandService.createRoomBlock(createRoomBlockRequest, sessionUser)
                )
        );
    }

    @PostMapping("/{blockId}/deactivate")
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<RoomBlockMutationResponse> deactivateRoomBlock(
            @PathVariable Long blockId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(
                RoomBlockMutationResponse.from(
                        opsRoomBlockCommandService.deactivateRoomBlock(blockId, sessionUser)
                )
        );
    }
}
