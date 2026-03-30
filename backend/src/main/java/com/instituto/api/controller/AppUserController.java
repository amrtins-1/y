package com.instituto.api.controller;

import com.instituto.api.controller.dto.ProfileUpdateRequest;
import com.instituto.api.controller.dto.RegisterRequest;
import com.instituto.api.model.AppUser;
import com.instituto.api.service.AppUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class AppUserController {
    private final AppUserService appUserService;

    public AppUserController(AppUserService service) {
        this.appUserService = service;
    }

    @PostMapping
    public AppUser create(@Valid @RequestBody RegisterRequest body) {
        return appUserService.register(body);
    }

    @GetMapping("/{id}")
    public AppUser getById(@PathVariable UUID id, HttpServletRequest request) {
        UUID userId = getAuthenticatedUserId(request);
        if (!id.equals(userId)) {
            throw new IllegalArgumentException("Usuario nao autorizado.");
        }
        return appUserService.findById(id);
    }

    @PutMapping("/{id}/profile")
    public AppUser updateProfile(
        @PathVariable UUID id,
        @RequestBody ProfileUpdateRequest request,
        HttpServletRequest servletRequest
    ) {
        UUID userId = getAuthenticatedUserId(servletRequest);
        if (!id.equals(userId)) {
            throw new IllegalArgumentException("Usuario nao autorizado.");
        }
        return appUserService.updateProfile(id, request);
    }

    private UUID getAuthenticatedUserId(HttpServletRequest request) {
        Object value = request.getAttribute("AUTH_USER_ID");
        if (value instanceof UUID uuid) {
            return uuid;
        }
        throw new IllegalArgumentException("Usuario nao autenticado.");
    }
}
