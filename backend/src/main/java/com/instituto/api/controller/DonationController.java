package com.instituto.api.controller;

import com.instituto.api.model.Donation;
import com.instituto.api.service.DonationService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/donations")
public class DonationController extends AbstractCrudController<Donation, UUID> {

    public DonationController(DonationService service) {
        super(service);
    }
}
