package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import com.guesthouse.shared.domain.user.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;

public class RoleGuardInterceptor implements HandlerInterceptor {

    private final SessionIntegrityService sessionIntegrityService;

    public RoleGuardInterceptor() {
        this(null);
    }

    public RoleGuardInterceptor(SessionIntegrityService sessionIntegrityService) {
        this.sessionIntegrityService = sessionIntegrityService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequireRoles requireRoles = findAnnotation(handlerMethod);
        if (requireRoles == null) {
            return true;
        }

        HttpSession session = request.getSession(false);
        SessionUser sessionUser = session == null
                ? null
                : (SessionUser) session.getAttribute(SessionAuthConstants.SESSION_USER_ATTRIBUTE);

        if (sessionUser == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        if (sessionIntegrityService != null) {
            sessionIntegrityService.validate(session, sessionUser);
        }

        Set<UserRole> allowedRoles = EnumSet.copyOf(Arrays.asList(requireRoles.value()));
        if (!allowedRoles.contains(sessionUser.role())) {
            throw new AppException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        return true;
    }

    private RequireRoles findAnnotation(HandlerMethod handlerMethod) {
        RequireRoles methodAnnotation = handlerMethod.getMethodAnnotation(RequireRoles.class);
        if (methodAnnotation != null) {
            return methodAnnotation;
        }
        return handlerMethod.getBeanType().getAnnotation(RequireRoles.class);
    }
}
