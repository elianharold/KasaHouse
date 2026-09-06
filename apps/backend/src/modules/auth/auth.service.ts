import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { OtpChallenge, User as PrismaUser } from '@prisma/client';
import type {
  AuthSession,
  AuthTokens,
  JwtAccessTokenClaims,
  RequestOtpResult,
  UserRole,
} from '@kasahouse/shared-types';
import type { AppConfig } from '../../common/config/configuration';
import { DomainException } from '../../common/errors/domain.exception';
import {
  generateNumericCode,
  generateOpaqueToken,
  hashOtp,
  safeEqualHex,
  sha256,
} from '../../common/utils/crypto';
import { maskPhone, normalizeGhanaPhone } from '../../common/utils/phone';
import { SMS_PROVIDER, type SmsProvider } from '../sms/sms.provider';
import { toUser } from '../users/user.mapper';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  async requestOtp(rawPhone: string): Promise<RequestOtpResult> {
    const phone = normalizeGhanaPhone(rawPhone);
    const otp = this.config.get('otp', { infer: true });

    const previous = await this.repo.latestChallengeForPhone(phone);
    if (previous) {
      const elapsed = (Date.now() - previous.createdAt.getTime()) / 1000;
      if (elapsed < otp.resendCooldownSeconds) {
        throw new DomainException(
          'RESEND_TOO_SOON',
          'Please wait a moment before requesting another code.',
          HttpStatus.TOO_MANY_REQUESTS,
          { retryAfterSeconds: Math.ceil(otp.resendCooldownSeconds - elapsed) },
        );
      }
    }

    const existingUser = await this.repo.findUserByPhone(phone);
    const code = generateNumericCode(otp.length);

    const challenge = await this.repo.createChallenge({
      phone,
      codeHash: hashOtp(code, otp.pepper),
      role: null,
      userId: existingUser?.id ?? null,
      expiresAt: new Date(Date.now() + otp.ttlSeconds * 1000),
    });

    const result = await this.sms.send({
      to: phone,
      purpose: 'otp',
      message:
        `Your KasaHouse verification code is ${code}. ` +
        `It expires in ${Math.round(otp.ttlSeconds / 60)} minutes. Never share this code.`,
    });

    if (result.status === 'failed') {
      throw new DomainException(
        'SMS_SEND_FAILED',
        'We could not send the code right now. Please try again shortly.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      challengeId: challenge.id,
      maskedPhone: maskPhone(phone),
      expiresInSeconds: otp.ttlSeconds,
      resendAfterSeconds: otp.resendCooldownSeconds,
      devCode: result.devPreview ?? undefined,
    };
  }

  async verifyOtp(
    challengeId: string,
    code: string,
    role: UserRole | undefined,
    userAgent: string | null,
  ): Promise<AuthSession> {
    const otp = this.config.get('otp', { infer: true });
    const challenge = await this.repo.findChallengeById(challengeId);

    if (!challenge) {
      throw new DomainException(
        'OTP_INVALID',
        'This code request is no longer valid. Start again.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    this.assertChallengeUsable(challenge, otp.maxVerifyAttempts);

    if (!safeEqualHex(hashOtp(code, otp.pepper), challenge.codeHash)) {
      const nextAttempts = challenge.attempts + 1;
      const willLock = nextAttempts >= otp.maxVerifyAttempts;
      await this.repo.incrementChallengeAttempts(challenge.id, willLock);
      throw new DomainException(
        willLock ? 'OTP_LOCKED' : 'OTP_INVALID',
        willLock
          ? 'Too many incorrect attempts. Request a new code.'
          : 'That code is not correct. Check the SMS and try again.',
        HttpStatus.UNAUTHORIZED,
        { attemptsRemaining: Math.max(0, otp.maxVerifyAttempts - nextAttempts) },
      );
    }

    let user = await this.repo.findUserByPhone(challenge.phone);
    let isNewUser = false;
    if (!user) {
      if (!role) {
        throw new DomainException(
          'ROLE_REQUIRED_FOR_SIGNUP',
          'Tell us whether you are listing a property or looking for one.',
        );
      }
      user = await this.repo.createUser(challenge.phone, role);
      isNewUser = true;
      this.logger.log(
        `New account for ${maskPhone(challenge.phone)} as ${role}`,
      );
    }

    await this.repo.consumeChallenge(challenge.id);
    const tokens = await this.issueTokens(user, userAgent);
    return { tokens, user: toUser(user), isNewUser };
  }

  async refresh(rawToken: string, userAgent: string | null): Promise<AuthTokens> {
    const stored = await this.repo.findRefreshTokenByHash(sha256(rawToken));

    if (!stored) {
      throw new DomainException(
        'REFRESH_INVALID',
        'Please sign in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (stored.revokedAt) {
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId}; revoking all sessions`,
      );
      await this.repo.revokeAllForUser(stored.userId);
      throw new DomainException(
        'REFRESH_REUSED',
        'For your security we signed you out everywhere. Please sign in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new DomainException(
        'REFRESH_EXPIRED',
        'Your session expired. Please sign in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.repo.findUserById(stored.userId);
    if (!user) {
      throw new DomainException(
        'REFRESH_INVALID',
        'Please sign in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const jwtConfig = this.config.get('jwt', { infer: true });
    const newRaw = generateOpaqueToken();
    await this.repo.rotateRefreshToken({
      oldId: stored.id,
      userId: stored.userId,
      newTokenHash: sha256(newRaw),
      expiresAt: new Date(Date.now() + jwtConfig.refreshTtl * 1000),
      userAgent,
    });

    return {
      accessToken: await this.signAccessToken(user),
      refreshToken: newRaw,
      accessTokenExpiresIn: jwtConfig.accessTtl,
    };
  }

  async logout(rawToken: string): Promise<void> {
    const stored = await this.repo.findRefreshTokenByHash(sha256(rawToken));
    if (stored && !stored.revokedAt) {
      await this.repo.revokeRefreshToken(stored.id);
    }
  }

  // ─────────────────────────── internals ───────────────────────────

  private assertChallengeUsable(
    challenge: OtpChallenge,
    maxAttempts: number,
  ): void {
    if (challenge.consumedAt) {
      throw new DomainException(
        'OTP_ALREADY_USED',
        'That code was already used. Request a new one.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (challenge.lockedAt || challenge.attempts >= maxAttempts) {
      throw new DomainException(
        'OTP_LOCKED',
        'Too many incorrect attempts. Request a new code.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new DomainException(
        'OTP_EXPIRED',
        'That code has expired. Request a new one.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private async issueTokens(
    user: PrismaUser,
    userAgent: string | null,
  ): Promise<AuthTokens> {
    const jwtConfig = this.config.get('jwt', { infer: true });
    const rawRefresh = generateOpaqueToken();

    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash: sha256(rawRefresh),
      expiresAt: new Date(Date.now() + jwtConfig.refreshTtl * 1000),
      userAgent,
    });

    return {
      accessToken: await this.signAccessToken(user),
      refreshToken: rawRefresh,
      accessTokenExpiresIn: jwtConfig.accessTtl,
    };
  }

  private signAccessToken(user: PrismaUser): Promise<string> {
    const jwtConfig = this.config.get('jwt', { infer: true });
    const payload: Omit<JwtAccessTokenClaims, 'iat' | 'exp'> = {
      sub: user.id,
      phone: user.phone,
      roles: user.roles as UserRole[],
    };
    return this.jwt.signAsync(payload, {
      secret: jwtConfig.accessSecret,
      expiresIn: jwtConfig.accessTtl,
    });
  }
}
