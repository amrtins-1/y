package com.instituto.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private final Map<String, AttemptWindow> attempts = new ConcurrentHashMap<>();

    @Value("${app.auth.login.max-attempts:10}")
    private int maxAttempts;

    @Value("${app.auth.login.window-seconds:900}")
    private long windowSeconds;

    @Value("${app.auth.login.block-seconds:900}")
    private long blockSeconds;

    public boolean isBlocked(String key) {
        AttemptWindow window = attempts.get(key);
        if (window == null) {
            return false;
        }
        long now = Instant.now().getEpochSecond();
        if (window.blockedUntil > now) {
            return true;
        }
        if (now - window.windowStart >= windowSeconds) {
            attempts.remove(key);
        }
        return false;
    }

    public void registerFailure(String key) {
        long now = Instant.now().getEpochSecond();
        attempts.compute(key, (ignored, existing) -> {
            if (existing == null || now - existing.windowStart >= windowSeconds) {
                return new AttemptWindow(now, 1, 0);
            }
            int next = existing.count + 1;
            long blockedUntil = existing.blockedUntil;
            if (next >= maxAttempts) {
                blockedUntil = now + blockSeconds;
            }
            return new AttemptWindow(existing.windowStart, next, blockedUntil);
        });
    }

    public void registerSuccess(String key) {
        attempts.remove(key);
    }

    private record AttemptWindow(long windowStart, int count, long blockedUntil) {}
}
