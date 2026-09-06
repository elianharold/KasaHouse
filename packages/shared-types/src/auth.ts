import type { ISODateString } from './common';
import type { User, UserRole } from './user';

/** Step 1: request an OTP for a phone number. */
export interface RequestOtpPayload {
  /** Local or international format; server normalises to E.164 (+233...). */
  phone: string;
}

export interface RequestOtpResult {
  /** Opaque handle tying the verify call to this request. */
  challengeId: string;
  /** E.164 phone the code was sent to (masked for display, e.g. +2332012***67). */
  maskedPhone: string;
  /** Seconds until the code expires. */
  expiresInSeconds: number;
  /** Seconds the client must wait before a resend is allowed. */
  resendAfterSeconds: number;
  /** Only populated when the backend SMS provider is the console/dev stub. */
  devCode?: string;
}

/** Step 2: verify the OTP and exchange it for a session. */
export interface VerifyOtpPayload {
  challengeId: string;
  code: string;
  /**
   * Required only when the phone has no account yet — picks the initial role.
   * Ignored for existing accounts.
   */
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  accessTokenExpiresIn: number;
}

export interface AuthSession {
  tokens: AuthTokens;
  user: User;
  /** True when this verify call created the account. */
  isNewUser: boolean;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface JwtAccessTokenClaims {
  /** user id */
  sub: string;
  phone: string;
  roles: UserRole[];
  iat: number;
  exp: number;
}

export interface AuthErrorContext {
  code:
    | 'OTP_EXPIRED'
    | 'OTP_INVALID'
    | 'OTP_LOCKED'
    | 'OTP_ALREADY_USED'
    | 'RESEND_TOO_SOON'
    | 'ROLE_REQUIRED_FOR_SIGNUP';
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
  occurredAt: ISODateString;
}
