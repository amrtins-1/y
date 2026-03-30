package com.instituto.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1)
public class PublicApiRateLimitFilter extends OncePerRequestFilter {

    private static final List<RouteRule> PROTECTED_PUBLIC_ROUTES = List.of(
        new RouteRule("POST", "/api/auth-sessions/login"),
        new RouteRule("POST", "/api/users"),
        new RouteRule("POST", "/api/email-verification/request"),
        new RouteRule("POST", "/api/email-verification/confirm-code"),
        new RouteRule("POST", "/api/contact-messages"),
        new RouteRule("POST", "/api/consultancy-requests"),
        new RouteRule("POST", "/api/newsletter-subscribers"),
        new RouteRule("POST", "/api/donations")
    );

    private static final int LIMIT_PER_MINUTE = 30;
    private static final long WINDOW_SECONDS = 60;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Value("${app.trust-proxy-headers:false}")
    private boolean trustProxyHeaders;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if (path == null || !path.startsWith("/api/")) {
            return true;
        }
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        return PROTECTED_PUBLIC_ROUTES.stream().noneMatch(rule -> rule.matches(method, path));
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String ip = clientIp(request);
        String key = request.getMethod() + ":" + request.getRequestURI() + ":" + ip;

        long now = Instant.now().getEpochSecond();
        WindowCounter counter = counters.compute(key, (ignoredKey, existing) -> {
            if (existing == null || now - existing.windowStart >= WINDOW_SECONDS) {
                return new WindowCounter(now, 1);
            }
            return new WindowCounter(existing.windowStart, existing.count + 1);
        });

        if (counter.count > LIMIT_PER_MINUTE) {
            tooManyRequests(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        if (trustProxyHeaders) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                String first = forwarded.split(",")[0].trim();
                if (!first.isBlank()) {
                    return first;
                }
            }
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return realIp.trim();
            }
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private void tooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Limite de requisicoes atingido. Tente novamente em instantes.\"}");
    }

    private record RouteRule(String method, String path) {
        boolean matches(String requestMethod, String requestPath) {
            return method.equalsIgnoreCase(requestMethod) && path.equals(requestPath);
        }
    }

    private record WindowCounter(long windowStart, int count) {}
}
