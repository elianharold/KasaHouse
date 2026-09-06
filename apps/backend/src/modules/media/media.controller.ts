import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  UserRole,
  type CloudinaryUploadSignature,
  type Media,
} from '@kasahouse/shared-types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import {
  RegisterMediaDto,
  ReorderMediaDto,
  RequestUploadSignatureDto,
} from './dto/media.dto';
import { MediaService } from './media.service';

@Controller('media')
@Roles(UserRole.LANDLORD)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload-signature')
  @HttpCode(HttpStatus.OK)
  uploadSignature(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestUploadSignatureDto,
  ): Promise<CloudinaryUploadSignature> {
    return this.media.createUploadSignature(userId, dto);
  }

  @Post()
  register(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterMediaDto,
  ): Promise<Media> {
    return this.media.register(userId, dto);
  }

  @Patch('listing/:listingId/reorder')
  reorder(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<Media[]> {
    return this.media.reorder(userId, listingId, dto.orderedIds);
  }

  @Delete(':mediaId')
  remove(
    @CurrentUser('id') userId: string,
    @Param('mediaId') mediaId: string,
  ): Promise<{ id: string }> {
    return this.media.remove(userId, mediaId);
  }
}
