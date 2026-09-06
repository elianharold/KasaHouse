import { IsString, Length } from 'class-validator';
import type { RefreshTokenPayload } from '@kasahouse/shared-types';

export class RefreshDto implements RefreshTokenPayload {
  @IsString()
  @Length(20, 512)
  refreshToken!: string;
}
