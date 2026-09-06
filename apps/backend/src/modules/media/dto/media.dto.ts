import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';
import {
  MediaType,
  type RegisterMediaPayload,
  type ReorderMediaPayload,
  type RequestUploadSignaturePayload,
} from '@kasahouse/shared-types';

export class RequestUploadSignatureDto implements RequestUploadSignaturePayload {
  @IsString() @Length(1, 64) listingId!: string;

  @IsIn(['image', 'video'])
  resourceType!: 'image' | 'video';
}

export class RegisterMediaDto implements RegisterMediaPayload {
  @IsString() @Length(1, 64) listingId!: string;

  @IsIn([MediaType.IMAGE, MediaType.VIDEO])
  type!: MediaType;

  @IsString() @Length(1, 256) storageKey!: string;

  @IsUrl({ require_protocol: true }) url!: string;
  @IsUrl({ require_protocol: true }) thumbnailUrl!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) width?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) height?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) durationSeconds?: number;
}

export class ReorderMediaDto implements ReorderMediaPayload {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  orderedIds!: string[];
}
