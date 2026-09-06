import { IsString, Length } from 'class-validator';
import type { RequestOtpPayload } from '@kasahouse/shared-types';

export class RequestOtpDto implements RequestOtpPayload {
  @IsString()
  @Length(7, 20, { message: 'Enter a valid phone number.' })
  phone!: string;
}
