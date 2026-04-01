import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { VideoItem } from '../entities/video-item.entity';
import { VideoItemService } from '../services/video-item.service';

@Controller('api/videos')
export class VideoItemController extends GenericCrudController<VideoItem, string> {
  constructor(service: VideoItemService) {
    super(service);
  }
}
