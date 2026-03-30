package com.instituto.api.service;

import com.instituto.api.controller.dto.RegisterRequest;
import com.instituto.api.controller.dto.ProfileUpdateRequest;
import com.instituto.api.model.AppUser;
import com.instituto.api.model.enums.UserRole;
import com.instituto.api.repository.AppUserRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AppUserService extends AbstractCrudService<AppUser, UUID> {

    private final AppUserRepository repository;
    private final EmailValidationService emailValidationService;
    private final PasswordService passwordService;
    private final EmailVerificationService emailVerificationService;

    public AppUserService(
        AppUserRepository repository,
        EmailValidationService emailValidationService,
        PasswordService passwordService,
        EmailVerificationService emailVerificationService
    ) {
        super(repository);
        this.repository = repository;
        this.emailValidationService = emailValidationService;
        this.passwordService = passwordService;
        this.emailVerificationService = emailVerificationService;
    }

    @Override
    protected void setId(AppUser entity, UUID id) {
        entity.setId(id);
    }

    @Override
    public AppUser create(AppUser entity) {
        String rawPassword = entity.getPasswordHash() == null ? "" : entity.getPasswordHash().trim();
        if (rawPassword.length() < 8) {
            throw new IllegalArgumentException("A senha deve ter no minimo 8 caracteres.");
        }
        entity.setPasswordHash(passwordService.hash(rawPassword));
        entity.setRole(UserRole.MEMBER);
        entity.setIsActive(false);
        validateAndNormalize(entity, null);
        AppUser saved = repository.save(entity);
        emailVerificationService.sendVerificationForUser(saved);
        return saved;
    }

    public AppUser register(RegisterRequest request) {
        AppUser entity = new AppUser();
        entity.setFullName(request.getFullName() == null ? "" : request.getFullName().trim());
        entity.setEmail(request.getEmail());
        entity.setPhone(normalizeBlankToNull(request.getPhone()));
        entity.setPasswordHash(request.getPassword());
        return create(entity);
    }

    @Override
    public AppUser update(UUID id, AppUser entity) {
        AppUser existing = findById(id);
        String incomingPassword = entity.getPasswordHash();
        if (incomingPassword == null || incomingPassword.isBlank()) {
            entity.setPasswordHash(existing.getPasswordHash());
        } else if (!incomingPassword.startsWith("$2a$") && !incomingPassword.startsWith("$2b$") && !incomingPassword.startsWith("$2y$")) {
            if (incomingPassword.trim().length() < 8) {
                throw new IllegalArgumentException("A senha deve ter no minimo 8 caracteres.");
            }
            entity.setPasswordHash(passwordService.hash(incomingPassword.trim()));
        }
        validateAndNormalize(entity, id);
        return super.update(id, entity);
    }

    public boolean emailExists(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return repository.existsByEmailIgnoreCase(email.trim());
    }

    public AppUser updateProfile(UUID id, ProfileUpdateRequest request) {
        AppUser user = findById(id);

        String currentPassword = request.getCurrentPassword() == null ? "" : request.getCurrentPassword();
        if (currentPassword.isBlank()) {
            throw new IllegalArgumentException("Senha atual e obrigatoria.");
        }
        if (!passwordService.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Senha atual incorreta.");
        }

        String fullName = request.getFullName() == null ? "" : request.getFullName().trim();
        if (fullName.isBlank()) {
            throw new IllegalArgumentException("Nome completo e obrigatorio.");
        }
        user.setFullName(fullName);

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail().trim());
        }

        user.setPhone(normalizeBlankToNull(request.getPhone()));

        String cpfDigits = normalizeCpf(request.getCpf());
        if (cpfDigits != null && repository.existsByCpfAndIdNot(cpfDigits, id)) {
            throw new IllegalArgumentException("CPF ja cadastrado para outro usuario.");
        }
        user.setCpf(cpfDigits);

        String newPassword = request.getNewPassword() == null ? "" : request.getNewPassword().trim();
        if (!newPassword.isBlank()) {
            if (newPassword.length() < 8) {
                throw new IllegalArgumentException("A nova senha deve ter no minimo 8 caracteres.");
            }
            user.setPasswordHash(passwordService.hash(newPassword));
        }

        validateAndNormalize(user, id);
        return repository.save(user);
    }

    private void validateAndNormalize(AppUser entity, UUID currentId) {
        if (entity.getEmail() == null || entity.getEmail().isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório.");
        }

        String normalizedEmail = entity.getEmail().trim().toLowerCase();
        if (!emailValidationService.hasValidFormat(normalizedEmail)) {
            throw new IllegalArgumentException("Formato de e-mail inválido.");
        }
        if (!emailValidationService.hasDeliverableDomain(normalizedEmail)) {
            throw new IllegalArgumentException("Domínio de e-mail inválido ou inexistente.");
        }
        if (emailValidationService.isDisposableDomain(normalizedEmail)) {
            throw new IllegalArgumentException("E-mail temporario nao permitido. Informe um e-mail real.");
        }

        boolean exists = repository.existsByEmailIgnoreCase(normalizedEmail);
        if (exists && (currentId == null || repository.findById(currentId)
            .map(u -> !u.getEmail().equalsIgnoreCase(normalizedEmail))
            .orElse(true))) {
            throw new IllegalArgumentException("E-mail já cadastrado.");
        }

        entity.setEmail(normalizedEmail);
    }

    private String normalizeBlankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String normalizeCpf(String value) {
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.isBlank()) {
            return null;
        }
        if (digits.length() != 11) {
            throw new IllegalArgumentException("CPF deve conter 11 digitos.");
        }
        return digits;
    }
}


