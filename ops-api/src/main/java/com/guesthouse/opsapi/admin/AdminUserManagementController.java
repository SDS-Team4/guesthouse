package com.guesthouse.opsapi.admin;

import com.guesthouse.opsapi.admin.api.AdminUserDetailResponse;
import com.guesthouse.opsapi.admin.api.AdminUserSummaryResponse;
import com.guesthouse.opsapi.admin.service.AdminUserQueryService;
import com.guesthouse.shared.auth.session.RequireRoles;
import com.guesthouse.shared.domain.api.ApiResponse;
import com.guesthouse.shared.domain.user.UserRole;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequireRoles(UserRole.ADMIN)
public class AdminUserManagementController {

    private final AdminUserQueryService adminUserQueryService;

    public AdminUserManagementController(AdminUserQueryService adminUserQueryService) {
        this.adminUserQueryService = adminUserQueryService;
    }

    @GetMapping
    public ApiResponse<List<AdminUserSummaryResponse>> findUsers() {
        return ApiResponse.success(
                adminUserQueryService.findUsers().stream()
                        .map(AdminUserSummaryResponse::from)
                        .toList()
        );
    }

    @GetMapping("/{userId}")
    public ApiResponse<AdminUserDetailResponse> getUserDetail(@PathVariable Long userId) {
        return ApiResponse.success(
                AdminUserDetailResponse.from(adminUserQueryService.getUserDetail(userId))
        );
    }
}
