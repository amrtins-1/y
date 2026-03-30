package com.instituto.api.service;

import com.instituto.api.controller.dto.LoginRequest;
import com.instituto.api.controller.dto.LoginResponse;
import com.instituto.api.exception.InvalidCredentialsException;
import com.instituto.api.model.AppUser;
import com.instituto.api.model.AuthSession;
import com.instituto.api.model.enums.UserRole;
import com.instituto.api.repository.AppUserRepository;
import com.instituto.api.repository.AuthSessionRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthSessionService extends AbstractCrudService<AuthSession, UUID> {

    private final AuthSessionRepository authSessionRepository;
    private final AppUserRepository appUserRepository;
    private final EmailValidationService emailValidationService;
    private final PasswordService passwordService;
    private final LoginAttemptService loginAttemptService;

    public AuthSessionService(
        AuthSessionRepository repository,
        AppUserRepository appUserRepository,
        EmailValidationService emailValidationService,
        PasswordService passwordService,
        LoginAttemptService loginAttemptService
    ) {
        super(repository);
        this.authSessionRepository = repository;
        this.appUserRepository = appUserRepository;
        this.emailValidationService = emailValidationService;
        this.passwordService = passwordService;
        this.loginAttemptService = loginAttemptService;
    }

    @Override
    protected void setId(AuthSession entity, UUID id) {
        entity.setId(id);
    }
    public LoginResponse authenticate(LoginRequest request, String ip, String userAgent) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        String password = request.getPassword() == null ? "" : request.getPassword();
        String attemptKey = buildAttemptKey(email, ip);

        if (loginAttemptService.isBlocked(attemptKey)) {
            throw new InvalidCredentialsException("Muitas tentativas. Tente novamente em alguns minutos.");
        }

        if (!emailValidationService.hasValidFormat(email)) {
            loginAttemptService.registerFailure(attemptKey);
            throw new InvalidCredentialsException("Credenciais invalidas.");
        }

        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> {
                loginAttemptService.registerFailure(attemptKey);
                return new InvalidCredentialsException("Credenciais invalidas.");
            });

        boolean passwordMatches = passwordService.matches(password, user.getPasswordHash());
        if (!passwordMatches) {
            loginAttemptService.registerFailure(attemptKey);
            throw new InvalidCredentialsException("Credenciais invalidas.");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            loginAttemptService.registerFailure(attemptKey);
            throw new InvalidCredentialsException("Credenciais invalidas.");
        }

        // Migra hash legado em texto puro para bcrypt no primeiro login bem-sucedido.
        if (!passwordService.isBcryptHash(user.getPasswordHash())) {
            user.setPasswordHash(passwordService.hash(password));
        }

        boolean rememberMe = Boolean.TRUE.equals(request.getRememberMe());
        Instant now = Instant.now();

        AuthSession session = new AuthSession();
        session.setUser(user);
        session.setRememberMe(rememberMe);
        session.setIp(ip);
        session.setUserAgent(limit(userAgent, 255));
        session.setRefreshTokenHash(sha256(UUID.randomUUID().toString() + ":" + email + ":" + now.toEpochMilli()));
        session.setExpiresAt(now.plus(rememberMe ? 30 : 1, ChronoUnit.DAYS));

        AuthSession savedSession = authSessionRepository.save(session);
        user.setLastLoginAt(now);
        appUserRepository.save(user);
        loginAttemptService.registerSuccess(attemptKey);

        return new LoginResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            savedSession.getId(),
            savedSession.getExpiresAt(),
            Boolean.TRUE.equals(user.getIsActive())
        );
    }

    public void assertActiveSession(UUID sessionId, UUID expectedUserId) {
        requireActiveUser(sessionId, expectedUserId);
    }

    public AppUser requireActiveUser(UUID sessionId, UUID expectedUserId) {
        if (sessionId == null || expectedUserId == null) {
            throw new InvalidCredentialsException("Sessao invalida.");
        }

        AuthSession session = authSessionRepository
            .findByIdAndRevokedAtIsNullAndExpiresAtAfter(sessionId, Instant.now())
            .orElseThrow(() -> new InvalidCredentialsException("Sessao expirada ou invalida."));

        UUID sessionUserId = session.getUser() == null ? null : session.getUser().getId();
        if (!expectedUserId.equals(sessionUserId)) {
            throw new InvalidCredentialsException("Sessao nao autorizada para este usuario.");
        }
        AppUser sessionUser = session.getUser();
        if (sessionUser == null || !Boolean.TRUE.equals(sessionUser.getIsActive())) {
            throw new InvalidCredentialsException("Conta sem confirmacao de e-mail.");
        }
        return sessionUser;
    }

    public void assertAdminSession(UUID sessionId, UUID expectedUserId) {
        AppUser sessionUser = requireActiveUser(sessionId, expectedUserId);
        if (sessionUser.getRole() != UserRole.ADMIN) {
            throw new InvalidCredentialsException("Acesso restrito a administradores.");
        }
    }

    public void revokeSession(UUID sessionId, UUID expectedUserId) {
        if (sessionId == null || expectedUserId == null) {
            return;
        }

        authSessionRepository.findById(sessionId).ifPresent(session -> {
            UUID sessionUserId = session.getUser() == null ? null : session.getUser().getId();
            if (expectedUserId.equals(sessionUserId) && session.getRevokedAt() == null) {
                session.setRevokedAt(Instant.now());
                authSessionRepository.save(session);
            }
        });
    }

    private String sha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 não disponível", e);
        }
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String buildAttemptKey(String email, String ip) {
        String safeEmail = email == null ? "" : email.trim().toLowerCase();
        String safeIp = ip == null ? "unknown" : ip.trim();
        return safeEmail + "|" + safeIp;
    }
}
