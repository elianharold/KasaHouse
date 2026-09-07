import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type {
  PasswordLoginPayload,
  RequestEmailOtpPayload,
  SetPasswordPayload,
} from '@kasahouse/shared-types';
import { IsOptional } from 'class-validator';

export class RequestEmailOtpDto implements RequestEmailOtpPayload {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email!: string;
}

export class PasswordLoginDto implements PasswordLoginPayload {
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}

export class SetPasswordDto implements SetPasswordPayload {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: 'Use at least 8 characters.' })
  @MaxLength(200)
  newPassword!: string;
}
