import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import {
  ALL_USER_ROLES,
  type UserRole,
  type VerifyOtpPayload,
} from '@kasahouse/shared-types';

export class VerifyOtpDto implements VerifyOtpPayload {
  @IsString()
  @Length(1, 64)
  challengeId!: string;

  @IsString()
  @Matches(/^\d{4,8}$/, { message: 'Enter the code from the SMS.' })
  code!: string;

  @IsOptional()
  @IsIn(ALL_USER_ROLES, { message: 'Choose whether you are a landlord or a tenant.' })
  role?: UserRole;
}
