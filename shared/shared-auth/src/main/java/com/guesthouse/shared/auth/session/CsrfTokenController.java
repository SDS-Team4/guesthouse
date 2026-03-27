package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.auth.api.CsrfTokenResponse;
import com.guesthouse.shared.domain.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class CsrfTokenController {

    private final CsrfTokenService csrfTokenService;

    public CsrfTokenController(CsrfTokenService csrfTokenService) {
        this.csrfTokenService = csrfTokenService;
    }

    @GetMapping("/csrf-token")
    public ApiResponse<CsrfTokenResponse> getCsrfToken(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        HttpSession session = request.getSession(true);
        String token = csrfTokenService.ensureToken(session);
        csrfTokenService.attachToken(response, token);
        return ApiResponse.success(new CsrfTokenResponse(csrfTokenService.getHeaderName(), token));
    }
}
