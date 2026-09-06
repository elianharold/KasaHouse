import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import {
  ALL_USER_ROLES,
  type UpdateProfilePayload,
  type UserRole,
} from '@kasahouse/shared-types';

export class UpdateProfileDto implements UpdateProfilePayload {
  @IsOptional()
  @IsString()
  @Length(2, 80, { message: 'Enter your name (2–80 characters).' })
  fullName?: string;

  @IsOptional()
  @IsIn(ALL_USER_ROLES)
  addRole?: UserRole;
}
