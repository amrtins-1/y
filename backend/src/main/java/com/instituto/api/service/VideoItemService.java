package com.instituto.api.service;

import com.instituto.api.model.VideoItem;
import com.instituto.api.repository.VideoItemRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class VideoItemService extends AbstractCrudService<VideoItem, UUID> {

    public VideoItemService(VideoItemRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(VideoItem entity, UUID id) {
        entity.setId(id);
    }
}
