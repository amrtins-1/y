package com.instituto.api.service;

import com.instituto.api.model.UserAddress;
import com.instituto.api.repository.UserAddressRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class UserAddressService extends AbstractCrudService<UserAddress, UUID> {

    public UserAddressService(UserAddressRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(UserAddress entity, UUID id) {
        entity.setId(id);
    }
}
