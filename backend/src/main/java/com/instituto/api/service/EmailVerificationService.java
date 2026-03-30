package com.instituto.api.service;

import com.instituto.api.model.AppUser;
import com.instituto.api.model.EmailVerificationToken;
import com.instituto.api.repository.AppUserRepository;
import com.instituto.api.repository.EmailVerificationTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class EmailVerificationService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailVerificationService.class);

    private final AppUserRepository appUserRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailDeliveryService emailDeliveryService;
    private final EmailValidationService emailValidationService;

    @Value("${app.frontend-base-url:http://localhost:4321}")
    private String frontendBaseUrl;

    @Value("${app.api-base-url:http://localhost:8080}")
    private String apiBaseUrl;

    @Value("${app.email-verification.ttl-hours:24}")
    private int ttlHours;

    public EmailVerificationService(
        AppUserRepository appUserRepository,
        EmailVerificationTokenRepository tokenRepository,
        EmailDeliveryService emailDeliveryService,
        EmailValidationService emailValidationService
    ) {
        this.appUserRepository = appUserRepository;
        this.tokenRepository = tokenRepository;
        this.emailDeliveryService = emailDeliveryService;
        this.emailValidationService = emailValidationService;
    }

    public void sendVerificationForUser(AppUser user) {
        if (user == null || user.getId() == null || user.getEmail() == null) {
            return;
        }

        invalidateOpenTokens(user.getId());

        String rawToken = generateRawToken();
        String rawCode = generateNumericCode();
        String codeSalt = UUID.randomUUID().toString();
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setTokenHash(sha256(rawToken));
        token.setCodeSalt(codeSalt);
        token.setCodeHash(sha256(rawCode + ":" + codeSalt));
        token.setExpiresAt(Instant.now().plus(ttlHours, ChronoUnit.HOURS));
        tokenRepository.save(token);

        String verificationUrl = normalizeBaseUrl(apiBaseUrl) + "/api/email-verification/confirm?token=" + rawToken;
        String subject = "Confirme seu e-mail";
        String body = "Ola " + user.getFullName() + ",\n\n"
            + "Seu codigo de confirmacao e: " + rawCode + "\n\n"
            + "Digite este codigo na pagina de confirmacao do site.\n\n"
            + "Ou, se preferir, confirme clicando no link abaixo:\n"
            + verificationUrl + "\n\n"
            + "Este link expira em " + ttlHours + " horas.\n\n"
            + "Se voce nao solicitou este cadastro, ignore esta mensagem.";

        try {
            emailDeliveryService.send(user.getEmail(), subject, body);
        } catch (RuntimeException ex) {
            // Nao interrompe cadastro quando houver falha temporaria no SMTP.
            LOGGER.error("Falha ao enviar e-mail de verificacao para {}", user.getEmail(), ex);
        }
    }

    public void requestVerification(String email) {
        if (!emailValidationService.hasValidFormat(email)
            || !emailValidationService.hasDeliverableDomain(email)
            || emailValidationService.isDisposableDomain(email)) {
            return;
        }

        Optional<AppUser> maybeUser = appUserRepository.findByEmailIgnoreCase(email.trim());
        if (maybeUser.isEmpty()) {
            return;
        }

        AppUser user = maybeUser.get();
        if (Boolean.TRUE.equals(user.getIsActive())) {
            return;
        }

        sendVerificationForUser(user);
    }

    public boolean confirmByCode(String email, String code) {
        if (!emailValidationService.hasValidFormat(email)) {
            return false;
        }
        if (code == null || !code.matches("^\\d{6}$")) {
            return false;
        }

        Optional<AppUser> maybeUser = appUserRepository.findByEmailIgnoreCase(email.trim());
        if (maybeUser.isEmpty()) {
            return false;
        }

        AppUser user = maybeUser.get();
        if (Boolean.TRUE.equals(user.getIsActive())) {
            return true;
        }

        var openTokens = tokenRepository.findByUserIdAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(user.getId(), Instant.now());
        for (EmailVerificationToken token : openTokens) {
            String expectedHash = sha256(code + ":" + token.getCodeSalt());
            if (expectedHash.equals(token.getCodeHash())) {
                token.setUsedAt(Instant.now());
                tokenRepository.save(token);
                user.setIsActive(true);
                appUserRepository.save(user);
                return true;
            }
        }

        return false;
    }

    public boolean confirmByToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return false;
        }

        Optional<EmailVerificationToken> maybeToken = tokenRepository.findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(
            sha256(rawToken),
            Instant.now()
        );

        if (maybeToken.isEmpty()) {
            return false;
        }

        EmailVerificationToken token = maybeToken.get();
        AppUser user = token.getUser();
        if (user == null) {
            return false;
        }

        token.setUsedAt(Instant.now());
        tokenRepository.save(token);

        user.setIsActive(true);
        appUserRepository.save(user);
        return true;
    }

    private void invalidateOpenTokens(UUID userId) {
        tokenRepository.findByUserIdAndUsedAtIsNull(userId).forEach(token -> {
            token.setUsedAt(Instant.now());
            tokenRepository.save(token);
        });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String generateNumericCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String sha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 nao disponivel", e);
        }
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "http://localhost:4321";
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
