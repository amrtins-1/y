package com.instituto.api.repository;

import com.instituto.api.model.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {
    Optional<AuthSession> findByIdAndRevokedAtIsNullAndExpiresAtAfter(UUID id, Instant now);
}
