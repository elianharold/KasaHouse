import { Injectable } from '@nestjs/common';
import type {
  AuthChannel,
  OtpChallenge,
  RefreshToken,
  User,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(
    data: { phone?: string; email?: string },
    role: UserRole,
  ): Promise<User> {
    return this.prisma.user.create({
      data: { phone: data.phone, email: data.email, roles: [role] },
    });
  }

  setPassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /** Most recent challenge for a destination, for the resend cooldown check. */
  latestChallengeForDestination(
    channel: AuthChannel,
    destination: string,
  ): Promise<OtpChallenge | null> {
    return this.prisma.otpChallenge.findFirst({
      where: channel === 'EMAIL' ? { email: destination } : { phone: destination },
      orderBy: { createdAt: 'desc' },
    });
  }

  createChallenge(data: {
    channel: AuthChannel;
    phone?: string;
    email?: string;
    codeHash: string;
    role: UserRole | null;
    userId: string | null;
    expiresAt: Date;
  }): Promise<OtpChallenge> {
    return this.prisma.otpChallenge.create({ data });
  }

  findChallengeById(id: string): Promise<OtpChallenge | null> {
    return this.prisma.otpChallenge.findUnique({ where: { id } });
  }

  incrementChallengeAttempts(id: string, lock: boolean): Promise<OtpChallenge> {
    return this.prisma.otpChallenge.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        ...(lock ? { lockedAt: new Date() } : {}),
      },
    });
  }

  consumeChallenge(id: string): Promise<OtpChallenge> {
    return this.prisma.otpChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent: string | null;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  /** Atomically rotate: revoke the old token and link it to its replacement. */
  async rotateRefreshToken(params: {
    oldId: string;
    userId: string;
    newTokenHash: string;
    expiresAt: Date;
    userAgent: string | null;
  }): Promise<RefreshToken> {
    const [, created] = await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: params.oldId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: params.userId,
          tokenHash: params.newTokenHash,
          expiresAt: params.expiresAt,
          userAgent: params.userAgent,
        },
      }),
    ]);
    await this.prisma.refreshToken.update({
      where: { id: params.oldId },
      data: { replacedById: created.id },
    });
    return created;
  }

  revokeRefreshToken(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoke every live refresh token for a user (e.g. on reuse detection). */
  revokeAllForUser(userId: string): Promise<{ count: number }> {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
