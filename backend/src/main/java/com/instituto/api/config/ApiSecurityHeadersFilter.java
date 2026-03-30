package com.instituto.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;

@Component
@Order(4)
public class ApiSecurityHeadersFilter extends OncePerRequestFilter {

    @Value("${app.security.hsts-enabled:false}")
    private boolean hstsEnabled;

    @Value("${app.trust-proxy-headers:false}")
    private boolean trustProxyHeaders;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
        response.setHeader("Cache-Control", "no-store");
        if (hstsEnabled && isHttps(request)) {
            response.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
        }
        filterChain.doFilter(request, response);
    }

    private boolean isHttps(HttpServletRequest request) {
        if (request.isSecure()) {
            return true;
        }
        if (!trustProxyHeaders) {
            return false;
        }
        String proto = request.getHeader("X-Forwarded-Proto");
        return proto != null && proto.equalsIgnoreCase("https");
    }
}
