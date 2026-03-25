package com.guesthouse.opsapi.admin;

import com.guesthouse.opsapi.admin.api.AdminHostRoleRequestDecisionRequest;
import com.guesthouse.opsapi.admin.api.AdminHostRoleRequestDecisionResponse;
import com.guesthouse.opsapi.admin.api.AdminHostRoleRequestResponse;
import com.guesthouse.opsapi.admin.service.AdminHostRoleRequestCommandService;
import com.guesthouse.opsapi.admin.service.AdminHostRoleRequestQueryService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/host-role-requests")
@RequireRoles(UserRole.ADMIN)
public class AdminHostRoleRequestController {

    private final AdminHostRoleRequestQueryService adminHostRoleRequestQueryService;
    private final AdminHostRoleRequestCommandService adminHostRoleRequestCommandService;

    public AdminHostRoleRequestController(
            AdminHostRoleRequestQueryService adminHostRoleRequestQueryService,
            AdminHostRoleRequestCommandService adminHostRoleRequestCommandService
    ) {
        this.adminHostRoleRequestQueryService = adminHostRoleRequestQueryService;
        this.adminHostRoleRequestCommandService = adminHostRoleRequestCommandService;
    }

    @GetMapping
    public ApiResponse<List<AdminHostRoleRequestResponse>> findRequests(
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(
                adminHostRoleRequestQueryService.findRequests(status).stream()
                        .map(AdminHostRoleRequestResponse::from)
                        .toList()
        );
    }

    @GetMapping("/{requestId}")
    public ApiResponse<AdminHostRoleRequestResponse> getRequestDetail(@PathVariable Long requestId) {
        return ApiResponse.success(
                AdminHostRoleRequestResponse.from(adminHostRoleRequestQueryService.getRequestDetail(requestId))
        );
    }

    @PostMapping("/{requestId}/approve")
    public ApiResponse<AdminHostRoleRequestDecisionResponse> approveRequest(
            @PathVariable Long requestId,
            @CurrentSessionUser SessionUser sessionUser,
            @RequestBody(required = false) AdminHostRoleRequestDecisionRequest request
    ) {
        return ApiResponse.success(
                AdminHostRoleRequestDecisionResponse.from(
                        adminHostRoleRequestCommandService.approveRequest(
                                requestId,
                                sessionUser,
                                request == null ? null : request.reviewReason()
                        )
                )
        );
    }

    @PostMapping("/{requestId}/reject")
    public ApiResponse<AdminHostRoleRequestDecisionResponse> rejectRequest(
            @PathVariable Long requestId,
            @CurrentSessionUser SessionUser sessionUser,
            @Valid @RequestBody AdminHostRoleRequestDecisionRequest request
    ) {
        return ApiResponse.success(
                AdminHostRoleRequestDecisionResponse.from(
                        adminHostRoleRequestCommandService.rejectRequest(
                                requestId,
                                sessionUser,
                                request.reviewReason()
                        )
                )
        );
    }
}
