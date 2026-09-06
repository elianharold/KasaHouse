import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtAccessTokenClaims } from '@kasahouse/shared-types';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt', { infer: true }).accessSecret,
    });
  }

  /**
   * Passport has already verified the signature and expiry. We re-load the user
   * so a deactivated account or a role/KYC change takes effect immediately
   * rather than waiting for the token to expire.
   */
  async validate(claims: JwtAccessTokenClaims): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, phone: true, roles: true, kycStatus: true },
    });

    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    return user;
  }
}
