import { IsIn, IsISO8601, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { KycIdType, type SubmitKycPayload } from '@kasahouse/shared-types';

export class SubmitKycDto implements SubmitKycPayload {
  @IsIn([KycIdType.GHANA_CARD])
  idType!: typeof KycIdType.GHANA_CARD;

  @IsString()
  @Matches(/^GHA[- ]?\d{9}[- ]?\d$/i, {
    message: 'Enter your Ghana Card number, e.g. GHA-123456789-0.',
  })
  idNumber!: string;

  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsISO8601({ strict: false }, { message: 'Enter your date of birth.' })
  dateOfBirth!: string;

  // data: URLs — capped so a huge payload can't be posted.
  @IsOptional()
  @IsString()
  @MaxLength(8_000_000)
  frontImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8_000_000)
  selfieImage?: string;
}
