package com.instituto.api.service;

import com.instituto.api.model.Donation;
import com.instituto.api.repository.DonationRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class DonationService extends AbstractCrudService<Donation, UUID> {

    public DonationService(DonationRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(Donation entity, UUID id) {
        entity.setId(id);
    }
}
