package com.instituto.api.controller;

import com.instituto.api.controller.dto.LoginRequest;
import com.instituto.api.controller.dto.LoginResponse;
import com.instituto.api.service.AuthSessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth-sessions")
public class AuthSessionController {
    private static final String COOKIE_SESSION_ID = "SESSION_ID";
    private static final String COOKIE_USER_ID = "USER_ID";

    private final AuthSessionService authSessionService;

    @Value("${app.auth.cookie-secure:false}")
    private boolean authCookieSecure;

    @Value("${app.auth.cookie-samesite:Lax}")
    private String authCookieSameSite;

    public AuthSessionController(AuthSessionService service) {
        this.authSessionService = service;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest servletRequest,
        HttpServletResponse servletResponse
    ) {
        LoginResponse response = authSessionService.authenticate(
            request,
            servletRequest.getRemoteAddr(),
            servletRequest.getHeader("User-Agent")
        );
        addSessionCookie(servletResponse, COOKIE_SESSION_ID, response.getSessionId().toString(), response.getExpiresAt().toEpochMilli());
        addSessionCookie(servletResponse, COOKIE_USER_ID, response.getUserId().toString(), response.getExpiresAt().toEpochMilli());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
        @RequestHeader(value = "X-Session-Id", required = false) UUID sessionId,
        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        if (sessionId == null) {
            sessionId = parseUuidFromCookie(request, COOKIE_SESSION_ID);
        }
        if (userId == null) {
            userId = parseUuidFromCookie(request, COOKIE_USER_ID);
        }
        authSessionService.revokeSession(sessionId, userId);
        clearSessionCookie(response, COOKIE_SESSION_ID);
        clearSessionCookie(response, COOKIE_USER_ID);
    }

    private UUID parseUuidFromCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                try {
                    return UUID.fromString(cookie.getValue());
                } catch (IllegalArgumentException ignored) {
                    return null;
                }
            }
        }
        return null;
    }

    private void addSessionCookie(HttpServletResponse response, String name, String value, long expiresAtEpochMs) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(authCookieSecure)
            .path("/")
            .sameSite(authCookieSameSite)
            .maxAge(Math.max(1, (expiresAtEpochMs - System.currentTimeMillis()) / 1000))
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearSessionCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
            .httpOnly(true)
            .secure(authCookieSecure)
            .path("/")
            .sameSite(authCookieSameSite)
            .maxAge(0)
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }
}
