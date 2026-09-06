import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { MediaController } from './media.controller';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaRepository, CloudinaryService],
  exports: [MediaService],
})
export class MediaModule {}
