package com.guesthouse.opsapi.admin;

import com.guesthouse.opsapi.admin.api.AdminTermDetailResponse;
import com.guesthouse.opsapi.admin.api.AdminTermDraftCreateRequest;
import com.guesthouse.opsapi.admin.api.AdminTermMutationResponse;
import com.guesthouse.opsapi.admin.api.AdminTermSummaryResponse;
import com.guesthouse.opsapi.admin.api.AdminTermUpdateRequest;
import com.guesthouse.opsapi.admin.service.AdminTermCommandService;
import com.guesthouse.opsapi.admin.service.AdminTermMutationResult;
import com.guesthouse.opsapi.admin.service.AdminTermQueryService;
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
@RequestMapping("/api/v1/admin/terms")
@RequireRoles(UserRole.ADMIN)
public class AdminTermsController {

    private final AdminTermQueryService adminTermQueryService;
    private final AdminTermCommandService adminTermCommandService;

    public AdminTermsController(
            AdminTermQueryService adminTermQueryService,
            AdminTermCommandService adminTermCommandService
    ) {
        this.adminTermQueryService = adminTermQueryService;
        this.adminTermCommandService = adminTermCommandService;
    }

    @GetMapping
    public ApiResponse<List<AdminTermSummaryResponse>> findTerms() {
        return ApiResponse.success(
                adminTermQueryService.findTerms().stream()
                        .map(AdminTermSummaryResponse::from)
                        .toList()
        );
    }

    @GetMapping("/{termId}")
    public ApiResponse<AdminTermDetailResponse> getTermDetail(@PathVariable Long termId) {
        return ApiResponse.success(
                AdminTermDetailResponse.from(adminTermQueryService.getTermDetail(termId))
        );
    }

    @PostMapping("/{termId}/drafts")
    public ApiResponse<AdminTermMutationResponse> createDraft(
            @PathVariable Long termId,
            @CurrentSessionUser SessionUser sessionUser,
            @Valid @RequestBody AdminTermDraftCreateRequest request
    ) {
        return ApiResponse.success(
                AdminTermMutationResponse.from(
                        adminTermCommandService.createDraft(termId, request, sessionUser)
                )
        );
    }

    @PutMapping("/{termId}")
    public ApiResponse<AdminTermMutationResponse> updateDraft(
            @PathVariable Long termId,
            @CurrentSessionUser SessionUser sessionUser,
            @Valid @RequestBody AdminTermUpdateRequest request
    ) {
        AdminTermMutationResult result = adminTermCommandService.updateDraft(termId, request, sessionUser);
        return ApiResponse.success(AdminTermMutationResponse.from(result));
    }

    @PostMapping("/{termId}/publish")
    public ApiResponse<AdminTermMutationResponse> publishTerm(
            @PathVariable Long termId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(
                AdminTermMutationResponse.from(
                        adminTermCommandService.publishTerm(termId, sessionUser)
                )
        );
    }
}
