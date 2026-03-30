package com.instituto.api.controller;

import com.instituto.api.model.ConsultancyRequest;
import com.instituto.api.service.ConsultancyRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/consultancy-requests")
public class ConsultancyRequestController {
    private final ConsultancyRequestService service;

    public ConsultancyRequestController(ConsultancyRequestService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConsultancyRequest create(@Valid @RequestBody ConsultancyRequest body) {
        return service.create(body);
    }
}
