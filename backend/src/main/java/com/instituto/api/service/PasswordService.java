package com.instituto.api.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(12);

    public String hash(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String passwordHash) {
        if (rawPassword == null || passwordHash == null || passwordHash.isBlank()) {
            return false;
        }
        if (!isBcryptHash(passwordHash)) {
            return rawPassword.equals(passwordHash);
        }
        return encoder.matches(rawPassword, passwordHash);
    }

    public boolean isBcryptHash(String passwordHash) {
        if (passwordHash == null) {
            return false;
        }
        return passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$");
    }
}
