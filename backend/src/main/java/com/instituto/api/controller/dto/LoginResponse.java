package com.instituto.api.controller.dto;

import java.time.Instant;
import java.util.UUID;

public class LoginResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private UUID sessionId;
    private Instant expiresAt;
    private boolean emailVerified;

    public LoginResponse(UUID userId, String fullName, String email, UUID sessionId, Instant expiresAt, boolean emailVerified) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.sessionId = sessionId;
        this.expiresAt = expiresAt;
        this.emailVerified = emailVerified;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }
}
