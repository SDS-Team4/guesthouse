package com.guesthouse.opsapi.pricing;

import com.guesthouse.opsapi.pricing.api.CreatePricePolicyRequest;
import com.guesthouse.opsapi.pricing.api.OpsPricePolicyManagementResponse;
import com.guesthouse.opsapi.pricing.api.PricePolicyMutationResponse;
import com.guesthouse.opsapi.pricing.service.OpsPricePolicyCommandService;
import com.guesthouse.opsapi.pricing.service.OpsPricePolicyQueryService;
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
@RequestMapping("/api/v1/price-policies")
public class OpsPricePolicyController {

    private final OpsPricePolicyQueryService opsPricePolicyQueryService;
    private final OpsPricePolicyCommandService opsPricePolicyCommandService;

    public OpsPricePolicyController(
            OpsPricePolicyQueryService opsPricePolicyQueryService,
            OpsPricePolicyCommandService opsPricePolicyCommandService
    ) {
        this.opsPricePolicyQueryService = opsPricePolicyQueryService;
        this.opsPricePolicyCommandService = opsPricePolicyCommandService;
    }

    @GetMapping
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<OpsPricePolicyManagementResponse> findPricePolicies(
            @CurrentSessionUser SessionUser sessionUser,
            @RequestParam(required = false) Long accommodationId,
            @RequestParam(required = false) Long roomTypeId
    ) {
        return ApiResponse.success(
                OpsPricePolicyManagementResponse.from(
                        opsPricePolicyQueryService.getPricePolicyManagementView(sessionUser, accommodationId, roomTypeId)
                )
        );
    }

    @PostMapping
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<PricePolicyMutationResponse> createPricePolicy(
            @CurrentSessionUser SessionUser sessionUser,
            @RequestBody CreatePricePolicyRequest createPricePolicyRequest
    ) {
        return ApiResponse.success(
                PricePolicyMutationResponse.from(
                        opsPricePolicyCommandService.createPricePolicy(createPricePolicyRequest, sessionUser)
                )
        );
    }

    @PostMapping("/{policyId}/deactivate")
    @RequireRoles({UserRole.HOST, UserRole.ADMIN})
    public ApiResponse<PricePolicyMutationResponse> deactivatePricePolicy(
            @PathVariable Long policyId,
            @CurrentSessionUser SessionUser sessionUser
    ) {
        return ApiResponse.success(
                PricePolicyMutationResponse.from(
                        opsPricePolicyCommandService.deactivatePricePolicy(policyId, sessionUser)
                )
        );
    }
}
