package com.instituto.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
@Order(2)
public class ApiCsrfProtectionFilter extends OncePerRequestFilter {

    private static final String HEADER_SESSION_ID = "X-Session-Id";
    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String COOKIE_SESSION_ID = "SESSION_ID";
    private static final String COOKIE_USER_ID = "USER_ID";

    @Value("${app.allowed-origins:http://localhost:4321,http://127.0.0.1:4321}")
    private String allowedOriginsRaw;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null || !path.startsWith("/api/")) {
            return true;
        }
        String method = request.getMethod();
        return isSafeMethod(method) || "OPTIONS".equalsIgnoreCase(method);
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        if (isHeaderAuthenticated(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!hasSessionCookies(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            origin = originFromReferer(request.getHeader("Referer"));
        }

        if (origin == null || origin.isBlank()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Origem nao permitida.");
            return;
        }

        if (!allowedOrigins().contains(normalizeOrigin(origin))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Origem nao permitida.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isSafeMethod(String method) {
        return "GET".equalsIgnoreCase(method)
            || "HEAD".equalsIgnoreCase(method)
            || "TRACE".equalsIgnoreCase(method);
    }

    private boolean isHeaderAuthenticated(HttpServletRequest request) {
        String sessionId = request.getHeader(HEADER_SESSION_ID);
        String userId = request.getHeader(HEADER_USER_ID);
        return sessionId != null && !sessionId.isBlank()
            && userId != null && !userId.isBlank();
    }

    private boolean hasSessionCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return false;
        }
        boolean hasSession = false;
        boolean hasUser = false;
        for (Cookie cookie : cookies) {
            if (COOKIE_SESSION_ID.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                hasSession = true;
            } else if (COOKIE_USER_ID.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                hasUser = true;
            }
        }
        return hasSession && hasUser;
    }

    private String originFromReferer(String referer) {
        if (referer == null || referer.isBlank()) {
            return null;
        }
        try {
            URI uri = URI.create(referer);
            if (uri.getScheme() == null || uri.getHost() == null) {
                return null;
            }
            int port = uri.getPort();
            if (port == -1) {
                return uri.getScheme() + "://" + uri.getHost();
            }
            return uri.getScheme() + "://" + uri.getHost() + ":" + port;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Set<String> allowedOrigins() {
        String[] origins = Arrays.stream(allowedOriginsRaw.split(","))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .toArray(String[]::new);
        Set<String> normalized = new HashSet<>();
        for (String origin : origins) {
            normalized.add(normalizeOrigin(origin));
        }
        return normalized;
    }

    private String normalizeOrigin(String origin) {
        return origin.endsWith("/") ? origin.substring(0, origin.length() - 1) : origin;
    }
}
