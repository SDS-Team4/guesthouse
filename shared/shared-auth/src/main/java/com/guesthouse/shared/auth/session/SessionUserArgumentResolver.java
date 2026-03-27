package com.guesthouse.shared.auth.session;

import com.guesthouse.shared.domain.api.AppException;
import com.guesthouse.shared.domain.api.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

public class SessionUserArgumentResolver implements HandlerMethodArgumentResolver {

    private final SessionIntegrityService sessionIntegrityService;

    public SessionUserArgumentResolver() {
        this(null);
    }

    public SessionUserArgumentResolver(SessionIntegrityService sessionIntegrityService) {
        this.sessionIntegrityService = sessionIntegrityService;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentSessionUser.class)
                && SessionUser.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(
            MethodParameter parameter,
            ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest,
            WebDataBinderFactory binderFactory
    ) {
        CurrentSessionUser annotation = parameter.getParameterAnnotation(CurrentSessionUser.class);
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        HttpSession session = request == null ? null : request.getSession(false);
        SessionUser sessionUser = session == null
                ? null
                : (SessionUser) session.getAttribute(SessionAuthConstants.SESSION_USER_ATTRIBUTE);

        if (sessionUser == null && annotation != null && annotation.required()) {
            throw new AppException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
        }

        if (sessionUser != null && session != null && sessionIntegrityService != null) {
            sessionIntegrityService.validate(session, sessionUser);
        }

        return sessionUser;
    }
}
