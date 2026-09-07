import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthChannel as PrismaAuthChannel,
  OtpChallenge,
  User as PrismaUser,
} from '@prisma/client';
import {
  AuthChannel,
  type AuthSession,
  type AuthTokens,
  type JwtAccessTokenClaims,
  type RequestOtpResult,
  type UserRole,
} from '@kasahouse/shared-types';
import type { AppConfig } from '../../common/config/configuration';
import { DomainException } from '../../common/errors/domain.exception';
import {
  generateNumericCode,
  generateOpaqueToken,
  hashOtp,
  hashPassword,
  safeEqualHex,
  sha256,
  verifyPassword,
} from '../../common/utils/crypto';
import { maskEmail, normalizeEmail } from '../../common/utils/email';
import { maskPhone, normalizeGhanaPhone } from '../../common/utils/phone';
import { EMAIL_PROVIDER, type EmailProvider } from '../email/email.provider';
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
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
  ) {}

  // ─────────────────────────── request code ───────────────────────────

  async requestPhoneOtp(rawPhone: string): Promise<RequestOtpResult> {
    const phone = normalizeGhanaPhone(rawPhone);
    const user = await this.repo.findUserByPhone(phone);
    const code = await this.createAndStoreChallenge('SMS', { phone }, user?.id ?? null);

    const otp = this.config.get('otp', { infer: true });
    const result = await this.sms.send({
      to: phone,
      purpose: 'otp',
      message:
        `Your KasaHouse verification code is ${code.code}. ` +
        `It expires in ${Math.round(otp.ttlSeconds / 60)} minutes. Never share this code.`,
    });
    if (result.status === 'failed') {
      throw new DomainException(
        'SMS_SEND_FAILED',
        'We could not send the code right now. Please try again shortly.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return this.buildRequestResult(
      code.challengeId,
      AuthChannel.SMS,
      maskPhone(phone),
      result.devPreview,
    );
  }

  async requestEmailOtp(rawEmail: string): Promise<RequestOtpResult> {
    const email = normalizeEmail(rawEmail);
    const user = await this.repo.findUserByEmail(email);
    const code = await this.createAndStoreChallenge('EMAIL', { email }, user?.id ?? null);

    const otp = this.config.get('otp', { infer: true });
    const minutes = Math.round(otp.ttlSeconds / 60);
    const result = await this.email.send({
      to: email,
      purpose: 'otp',
      subject: `${code.code} is your KasaHouse code`,
      text: `Your KasaHouse verification code is ${code.code}. It expires in ${minutes} minutes. If you didn't request this, you can ignore this email.`,
      html: this.otpEmailHtml(code.code, minutes),
    });
    if (result.status === 'failed') {
      throw new DomainException(
        'EMAIL_SEND_FAILED',
        'We could not send the email right now. Please try again shortly.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return this.buildRequestResult(
      code.challengeId,
      AuthChannel.EMAIL,
      maskEmail(email),
      result.devPreview,
    );
  }

  // ─────────────────────────── verify code ───────────────────────────

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
      const where = challenge.channel === 'EMAIL' ? 'email' : 'SMS';
      throw new DomainException(
        willLock ? 'OTP_LOCKED' : 'OTP_INVALID',
        willLock
          ? 'Too many incorrect attempts. Request a new code.'
          : `That code is not correct. Check the ${where} and try again.`,
        HttpStatus.UNAUTHORIZED,
        { attemptsRemaining: Math.max(0, otp.maxVerifyAttempts - nextAttempts) },
      );
    }

    const isEmail = challenge.channel === 'EMAIL';
    const destination = isEmail ? challenge.email! : challenge.phone!;
    let user = isEmail
      ? await this.repo.findUserByEmail(destination)
      : await this.repo.findUserByPhone(destination);

    let isNewUser = false;
    if (!user) {
      if (!role) {
        throw new DomainException(
          'ROLE_REQUIRED_FOR_SIGNUP',
          'Tell us whether you are listing a property or looking for one.',
        );
      }
      user = await this.repo.createUser(
        isEmail ? { email: destination } : { phone: destination },
        role,
      );
      isNewUser = true;
      this.logger.log(
        `New account via ${challenge.channel} (${
          isEmail ? maskEmail(destination) : maskPhone(destination)
        }) as ${role}`,
      );
    }

    await this.repo.consumeChallenge(challenge.id);
    const tokens = await this.issueTokens(user, userAgent);
    return { tokens, user: toUser(user), isNewUser };
  }

  // ─────────────────────────── password ───────────────────────────

  async passwordLogin(
    rawEmail: string,
    password: string,
    userAgent: string | null,
  ): Promise<AuthSession> {
    const email = normalizeEmail(rawEmail);
    const user = await this.repo.findUserByEmail(email);

    // Uniform failure so we don't reveal which emails exist.
    const genericFail = new DomainException(
      'PASSWORD_INVALID',
      'That email and password do not match.',
      HttpStatus.UNAUTHORIZED,
    );

    if (!user || !user.passwordHash) {
      // Still spend ~one hash to blunt timing analysis.
      await verifyPassword(password, 'scrypt$00$00').catch(() => undefined);
      if (user && !user.passwordHash) {
        throw new DomainException(
          'PASSWORD_NOT_SET',
          'This account has no password yet. Sign in with an email code, then set one.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw genericFail;
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      throw genericFail;
    }

    const tokens = await this.issueTokens(user, userAgent);
    return { tokens, user: toUser(user), isNewUser: false };
  }

  async setPassword(
    userId: string,
    newPassword: string,
    currentPassword: string | undefined,
  ): Promise<void> {
    const minLen = this.config.get('auth', { infer: true }).minPasswordLength;
    if (newPassword.length < minLen) {
      throw new DomainException(
        'WEAK_PASSWORD',
        `Use at least ${minLen} characters for your password.`,
      );
    }

    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new DomainException('REFRESH_INVALID', 'Please sign in again.', HttpStatus.UNAUTHORIZED);
    }

    if (user.passwordHash) {
      if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
        throw new DomainException(
          'PASSWORD_INVALID',
          'Your current password is not correct.',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    if (!user.email) {
      throw new DomainException(
        'EMAIL_REQUIRED',
        'Add an email to your account before setting a password.',
      );
    }

    await this.repo.setPassword(userId, await hashPassword(newPassword));
    // A password change invalidates other sessions.
    await this.repo.revokeAllForUser(userId);
  }

  // ─────────────────────────── session lifecycle ───────────────────────────

  async refresh(rawToken: string, userAgent: string | null): Promise<AuthTokens> {
    const stored = await this.repo.findRefreshTokenByHash(sha256(rawToken));

    if (!stored) {
      throw new DomainException('REFRESH_INVALID', 'Please sign in again.', HttpStatus.UNAUTHORIZED);
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
      throw new DomainException('REFRESH_INVALID', 'Please sign in again.', HttpStatus.UNAUTHORIZED);
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

  private async createAndStoreChallenge(
    channel: PrismaAuthChannel,
    destination: { phone?: string; email?: string },
    userId: string | null,
  ): Promise<{ challengeId: string; code: string }> {
    const otp = this.config.get('otp', { infer: true });
    const key = channel === 'EMAIL' ? destination.email! : destination.phone!;

    const previous = await this.repo.latestChallengeForDestination(channel, key);
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

    const code = generateNumericCode(otp.length);
    const challenge = await this.repo.createChallenge({
      channel,
      ...destination,
      codeHash: hashOtp(code, otp.pepper),
      role: null,
      userId,
      expiresAt: new Date(Date.now() + otp.ttlSeconds * 1000),
    });
    return { challengeId: challenge.id, code };
  }

  private buildRequestResult(
    challengeId: string,
    channel: RequestOtpResult['channel'],
    maskedDestination: string,
    devPreview: string | null,
  ): RequestOtpResult {
    const otp = this.config.get('otp', { infer: true });
    return {
      challengeId,
      channel,
      maskedDestination,
      expiresInSeconds: otp.ttlSeconds,
      resendAfterSeconds: otp.resendCooldownSeconds,
      devCode: devPreview ?? undefined,
    };
  }

  private assertChallengeUsable(challenge: OtpChallenge, maxAttempts: number): void {
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
      email: user.email,
      roles: user.roles as UserRole[],
    };
    return this.jwt.signAsync(payload, {
      secret: jwtConfig.accessSecret,
      expiresIn: jwtConfig.accessTtl,
    });
  }

  private otpEmailHtml(code: string, minutes: number): string {
    return `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f6f5;margin:0;padding:32px">
<table role="presentation" style="max-width:440px;margin:0 auto;background:#fff;border-radius:14px;padding:32px">
<tr><td>
<h1 style="margin:0 0 8px;font-size:20px;color:#12211b">Your KasaHouse code</h1>
<p style="margin:0 0 20px;color:#5b6b63;font-size:14px">Enter this code to finish signing in. It expires in ${minutes} minutes.</p>
<div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0b7a4b;text-align:center;padding:16px 0">${code}</div>
<p style="margin:20px 0 0;color:#9aa8a1;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
</td></tr></table></body></html>`;
  }
}
