package com.instituto.api.controller;

import com.instituto.api.controller.dto.EmailCodeConfirmRequest;
import com.instituto.api.controller.dto.EmailVerificationRequest;
import com.instituto.api.service.EmailVerificationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/email-verification")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @Value("${app.frontend-base-url:http://localhost:4321}")
    private String frontendBaseUrl;

    public EmailVerificationController(EmailVerificationService emailVerificationService) {
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void request(@Valid @RequestBody EmailVerificationRequest request) {
        emailVerificationService.requestVerification(request.getEmail());
    }

    @GetMapping("/confirm")
    public ResponseEntity<Void> confirm(@RequestParam("token") String token) {
        boolean confirmed = emailVerificationService.confirmByToken(token);
        String base = frontendBaseUrl.endsWith("/") ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1) : frontendBaseUrl;
        String redirectUrl = confirmed ? base + "/login?emailConfirmed=1" : base + "/login?emailConfirmed=0";
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(redirectUrl)).build();
    }

    @PostMapping("/confirm-code")
    public Map<String, Object> confirmCode(@Valid @RequestBody EmailCodeConfirmRequest request) {
        boolean confirmed = emailVerificationService.confirmByCode(request.getEmail(), request.getCode());
        if (!confirmed) {
            throw new IllegalArgumentException("Codigo invalido ou expirado.");
        }
        return Map.of("confirmed", true, "message", "E-mail confirmado com sucesso.");
    }

    @GetMapping("/status")
    public Map<String, String> status() {
        return Map.of("message", "Email verification endpoint active");
    }
}
