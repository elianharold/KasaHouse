import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthSession, AuthTokens, RequestOtpResult } from '@kasahouse/shared-types';
import { Public } from '../../common/auth/public.decorator';
import { AuthService } from './auth.service';
import { RefreshDto } from './dto/refresh.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  // Tighter than the global limit: OTP requests hit the SMS bill.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  requestOtp(@Body() dto: RequestOtpDto): Promise<RequestOtpResult> {
    return this.auth.requestOtp(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthSession> {
    return this.auth.verifyOtp(dto.challengeId, dto.code, dto.role, userAgent ?? null);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body() dto: RefreshDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken, userAgent ?? null);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }
}
