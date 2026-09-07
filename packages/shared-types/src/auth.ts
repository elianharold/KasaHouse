import type { ISODateString } from './common';
import type { User, UserRole } from './user';

/** How a one-time code is delivered. */
export const AuthChannel = {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
} as const;
export type AuthChannel = (typeof AuthChannel)[keyof typeof AuthChannel];

/** Step 1 (phone): request an OTP for a phone number. */
export interface RequestOtpPayload {
  /** Local or international format; server normalises to E.164 (+233...). */
  phone: string;
}

/** Step 1 (email): request a login code for an email address. */
export interface RequestEmailOtpPayload {
  email: string;
}

export interface RequestOtpResult {
  /** Opaque handle tying the verify call to this request. */
  challengeId: string;
  channel: AuthChannel;
  /** Masked destination for display: "+2332012***67" or "a***@gmail.com". */
  maskedDestination: string;
  /** Seconds until the code expires. */
  expiresInSeconds: number;
  /** Seconds the client must wait before a resend is allowed. */
  resendAfterSeconds: number;
  /** Only populated when the backend provider is the console/dev stub. */
  devCode?: string;
}

/** Step 2: verify the code and exchange it for a session. Works for both channels. */
export interface VerifyOtpPayload {
  challengeId: string;
  code: string;
  /**
   * Required only when the destination has no account yet — picks the initial
   * role. Ignored for existing accounts.
   */
  role?: UserRole;
}

/** Fast path for accounts that have set a password. */
export interface PasswordLoginPayload {
  email: string;
  password: string;
}

/** Set or change the password on the signed-in account (optional convenience). */
export interface SetPasswordPayload {
  /** Current password — required only if one is already set. */
  currentPassword?: string;
  newPassword: string;
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
  phone: string | null;
  email: string | null;
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
    | 'ROLE_REQUIRED_FOR_SIGNUP'
    | 'INVALID_EMAIL'
    | 'PASSWORD_NOT_SET'
    | 'PASSWORD_INVALID'
    | 'WEAK_PASSWORD';
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
  occurredAt: ISODateString;
}
