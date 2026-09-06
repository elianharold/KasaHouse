import Cookies from 'js-cookie';
import type { AuthTokens, User } from '@kasahouse/shared-types';

/**
 * Web session storage. Tokens live in cookies so Next.js middleware and server
 * components can see them; a Zustand store mirrors them for client reactivity.
 *
 * NOTE: these cookies are set from JS (not httpOnly). That is acceptable for
 * this first cut but a hardening follow-up should move the refresh token behind
 * an httpOnly cookie set by a Next route handler.
 */
export const COOKIE = {
  access: 'kh_at',
  refresh: 'kh_rt',
  user: 'kh_user',
  authed: 'kh_authed', // lightweight flag middleware checks
} as const;

const baseOptions: Cookies.CookieAttributes = {
  sameSite: 'lax',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

export function persistSession(tokens: AuthTokens, user: User): void {
  Cookies.set(COOKIE.access, tokens.accessToken, {
    ...baseOptions,
    expires: 1, // 1 day; refreshed well before this
  });
  Cookies.set(COOKIE.refresh, tokens.refreshToken, { ...baseOptions, expires: 30 });
  Cookies.set(COOKIE.user, JSON.stringify(user), { ...baseOptions, expires: 30 });
  Cookies.set(COOKIE.authed, '1', { ...baseOptions, expires: 30 });
}

export function persistTokens(tokens: AuthTokens): void {
  Cookies.set(COOKIE.access, tokens.accessToken, { ...baseOptions, expires: 1 });
  Cookies.set(COOKIE.refresh, tokens.refreshToken, { ...baseOptions, expires: 30 });
}

export function persistUser(user: User): void {
  Cookies.set(COOKIE.user, JSON.stringify(user), { ...baseOptions, expires: 30 });
}

export function clearSession(): void {
  Object.values(COOKIE).forEach((name) => Cookies.remove(name, { path: '/' }));
}

export function readSession(): { tokens: AuthTokens | null; user: User | null } {
  const access = Cookies.get(COOKIE.access);
  const refresh = Cookies.get(COOKIE.refresh);
  const userRaw = Cookies.get(COOKIE.user);

  let user: User | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as User;
    } catch {
      user = null;
    }
  }

  const tokens =
    access && refresh
      ? { accessToken: access, refreshToken: refresh, accessTokenExpiresIn: 0 }
      : null;

  return { tokens, user };
}

export const getAccessToken = (): string | null => Cookies.get(COOKIE.access) ?? null;
export const getRefreshToken = (): string | null => Cookies.get(COOKIE.refresh) ?? null;
