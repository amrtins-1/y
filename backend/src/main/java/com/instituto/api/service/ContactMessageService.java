package com.instituto.api.service;

import com.instituto.api.model.ContactMessage;
import com.instituto.api.repository.ContactMessageRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class ContactMessageService extends AbstractCrudService<ContactMessage, UUID> {

    public ContactMessageService(ContactMessageRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(ContactMessage entity, UUID id) {
        entity.setId(id);
    }
}
