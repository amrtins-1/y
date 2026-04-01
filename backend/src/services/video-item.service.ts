import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoItem } from '../entities/video-item.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class VideoItemService extends AbstractCrudService<VideoItem, string> {
  constructor(@InjectRepository(VideoItem) repository: Repository<VideoItem>) {
    super(repository);
  }

  protected setId(entity: VideoItem, id: string): void {
    entity.id = id;
  }
}
