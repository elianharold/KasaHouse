import { Type } from 'class-transformer';
import { IsISO8601, IsOptional, IsString, Length } from 'class-validator';
import type {
  ListMessagesQuery,
  SendMessagePayload,
  StartChatPayload,
} from '@kasahouse/shared-types';

export class StartChatDto implements StartChatPayload {
  @IsString()
  @Length(1, 64)
  listingId!: string;
}

export class SendMessageDto implements SendMessagePayload {
  @IsString()
  @Length(1, 2000, { message: 'Messages can be up to 2000 characters.' })
  content!: string;
}

export class ListMessagesQueryDto implements ListMessagesQuery {
  @IsOptional()
  @IsISO8601()
  after?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}
