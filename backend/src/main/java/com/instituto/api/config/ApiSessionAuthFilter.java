package com.instituto.api.config;

import com.instituto.api.service.AuthSessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.UriTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Component
@Order(3)
public class ApiSessionAuthFilter extends OncePerRequestFilter {

    private static final String HEADER_SESSION_ID = "X-Session-Id";
    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String COOKIE_SESSION_ID = "SESSION_ID";
    private static final String COOKIE_USER_ID = "USER_ID";

    private static final List<RouteRule> PUBLIC_ROUTES = List.of(
        new RouteRule(null, "/api/email-verification/**"),
        new RouteRule("POST", "/api/auth-sessions/login"),
        new RouteRule("POST", "/api/users"),
        new RouteRule("POST", "/api/contact-messages"),
        new RouteRule("POST", "/api/newsletter-subscribers"),
        new RouteRule("POST", "/api/donations"),
        new RouteRule("GET", "/api/market-quotes"),
        new RouteRule("GET", "/api/market-quotes/{id}"),
        new RouteRule("GET", "/api/market-assets"),
        new RouteRule("GET", "/api/market-assets/{id}"),
        new RouteRule("GET", "/api/news-articles"),
        new RouteRule("GET", "/api/news-articles/{id}"),
        new RouteRule("GET", "/api/videos"),
        new RouteRule("GET", "/api/videos/{id}"),
        new RouteRule("GET", "/api/services"),
        new RouteRule("GET", "/api/services/{id}"),
        new RouteRule("GET", "/api/products"),
        new RouteRule("GET", "/api/products/{id}"),
        new RouteRule("GET", "/api/membership-plans"),
        new RouteRule("GET", "/api/membership-plans/{id}")
    );

    private static final List<RouteRule> ADMIN_ONLY_ROUTES = List.of(
        new RouteRule(null, "/api/user-addresses/**"),
        new RouteRule(null, "/api/user-subscriptions/**"),
        new RouteRule(null, "/api/market-watchlist/**"),
        new RouteRule(null, "/api/market-assets/**"),
        new RouteRule(null, "/api/market-quotes/**"),
        new RouteRule(null, "/api/news-articles/**"),
        new RouteRule(null, "/api/videos/**"),
        new RouteRule(null, "/api/services/**"),
        new RouteRule(null, "/api/products/**"),
        new RouteRule("POST", "/api/membership-plans"),
        new RouteRule("PUT", "/api/membership-plans/{id}"),
        new RouteRule("DELETE", "/api/membership-plans/{id}"),
        new RouteRule("GET", "/api/donations"),
        new RouteRule("GET", "/api/donations/{id}"),
        new RouteRule("PUT", "/api/donations/{id}"),
        new RouteRule("DELETE", "/api/donations/{id}"),
        new RouteRule("GET", "/api/newsletter-subscribers"),
        new RouteRule("GET", "/api/newsletter-subscribers/{id}"),
        new RouteRule("PUT", "/api/newsletter-subscribers/{id}"),
        new RouteRule("DELETE", "/api/newsletter-subscribers/{id}"),
        new RouteRule("GET", "/api/contact-messages"),
        new RouteRule("GET", "/api/contact-messages/{id}"),
        new RouteRule("GET", "/api/consultancy-requests"),
        new RouteRule("GET", "/api/consultancy-requests/{id}")
    );

    private final AuthSessionService authSessionService;

    public ApiSessionAuthFilter(AuthSessionService authSessionService) {
        this.authSessionService = authSessionService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/")) {
            return true;
        }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if (isPublicRoute(method, path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String sessionIdRaw = resolveSessionId(request);
        String userIdRaw = resolveUserId(request);

        if (sessionIdRaw == null || userIdRaw == null) {
            unauthorized(response, "Sessao obrigatoria.");
            return;
        }

        try {
            UUID sessionId = UUID.fromString(sessionIdRaw.trim());
            UUID userId = UUID.fromString(userIdRaw.trim());
            if (isAdminRoute(method, path)) {
                authSessionService.assertAdminSession(sessionId, userId);
            } else {
                authSessionService.assertActiveSession(sessionId, userId);
            }
            request.setAttribute("AUTH_USER_ID", userId);
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            unauthorized(response, "Sessao expirada ou invalida.");
        }
    }

    private boolean isPublicRoute(String method, String path) {
        for (RouteRule rule : PUBLIC_ROUTES) {
            if (rule.matches(method, path)) {
                return true;
            }
        }
        return false;
    }

    private boolean isAdminRoute(String method, String path) {
        for (RouteRule rule : ADMIN_ONLY_ROUTES) {
            if (rule.matches(method, path)) {
                return true;
            }
        }
        return false;
    }

    private String resolveSessionId(HttpServletRequest request) {
        String headerValue = request.getHeader(HEADER_SESSION_ID);
        if (headerValue != null && !headerValue.isBlank()) {
            return headerValue;
        }
        return readCookie(request, COOKIE_SESSION_ID);
    }

    private String resolveUserId(HttpServletRequest request) {
        String headerValue = request.getHeader(HEADER_USER_ID);
        if (headerValue != null && !headerValue.isBlank()) {
            return headerValue;
        }
        return readCookie(request, COOKIE_USER_ID);
    }

    private String readCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"" + message + "\"}");
    }

    private record RouteRule(String method, String pattern) {
        boolean matches(String requestMethod, String requestPath) {
            if (method != null && !method.equalsIgnoreCase(requestMethod)) {
                return false;
            }
            UriTemplate uriTemplate = new UriTemplate(pattern.replace("/**", "/{rest}"));
            if (pattern.endsWith("/**")) {
                String base = pattern.substring(0, pattern.length() - 3);
                return requestPath.equals(base) || requestPath.startsWith(base + "/");
            }
            return uriTemplate.matches(requestPath);
        }
    }
}
