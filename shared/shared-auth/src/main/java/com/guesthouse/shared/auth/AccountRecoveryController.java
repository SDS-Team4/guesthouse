package com.guesthouse.shared.auth;

import com.guesthouse.shared.auth.api.FindIdRequest;
import com.guesthouse.shared.auth.api.FindIdVerifyRequest;
import com.guesthouse.shared.auth.api.FindIdVerifyResponse;
import com.guesthouse.shared.auth.api.RecoveryRequestResponse;
import com.guesthouse.shared.auth.api.ResetPasswordConfirmRequest;
import com.guesthouse.shared.auth.api.ResetPasswordConfirmResponse;
import com.guesthouse.shared.auth.api.ResetPasswordRequest;
import com.guesthouse.shared.auth.api.ResetPasswordVerifyRequest;
import com.guesthouse.shared.auth.api.ResetPasswordVerifyResponse;
import com.guesthouse.shared.auth.service.AccountRecoveryService;
import com.guesthouse.shared.domain.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AccountRecoveryController {

    private final AccountRecoveryService accountRecoveryService;

    public AccountRecoveryController(AccountRecoveryService accountRecoveryService) {
        this.accountRecoveryService = accountRecoveryService;
    }

    @PostMapping("/find-id/request")
    public ApiResponse<RecoveryRequestResponse> requestFindId(@Valid @RequestBody FindIdRequest request) {
        return ApiResponse.success(accountRecoveryService.requestFindId(request));
    }

    @PostMapping("/find-id/verify")
    public ApiResponse<FindIdVerifyResponse> verifyFindId(@Valid @RequestBody FindIdVerifyRequest request) {
        return ApiResponse.success(accountRecoveryService.verifyFindId(request));
    }

    @PostMapping("/reset-password/request")
    public ApiResponse<RecoveryRequestResponse> requestResetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ApiResponse.success(accountRecoveryService.requestPasswordReset(request));
    }

    @PostMapping("/reset-password/verify")
    public ApiResponse<ResetPasswordVerifyResponse> verifyResetPassword(@Valid @RequestBody ResetPasswordVerifyRequest request) {
        return ApiResponse.success(accountRecoveryService.verifyPasswordReset(request));
    }

    @PostMapping("/reset-password/confirm")
    public ApiResponse<ResetPasswordConfirmResponse> confirmResetPassword(
            @Valid @RequestBody ResetPasswordConfirmRequest request
    ) {
        return ApiResponse.success(accountRecoveryService.confirmPasswordReset(request));
    }
}
