package com.instituto.api.repository;

import com.instituto.api.model.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {
    List<EmailVerificationToken> findByUserIdAndUsedAtIsNull(UUID userId);
    List<EmailVerificationToken> findByUserIdAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(UUID userId, Instant now);
    Optional<EmailVerificationToken> findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(String tokenHash, Instant now);
}
