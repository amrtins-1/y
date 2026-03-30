package com.instituto.api.controller;

import com.instituto.api.model.UserAddress;
import com.instituto.api.service.UserAddressService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-addresses")
public class UserAddressController extends AbstractCrudController<UserAddress, UUID> {

    public UserAddressController(UserAddressService service) {
        super(service);
    }
}
