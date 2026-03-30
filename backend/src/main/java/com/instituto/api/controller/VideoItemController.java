package com.instituto.api.controller;

import com.instituto.api.model.VideoItem;
import com.instituto.api.service.VideoItemService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/videos")
public class VideoItemController extends AbstractCrudController<VideoItem, UUID> {

    public VideoItemController(VideoItemService service) {
        super(service);
    }
}
