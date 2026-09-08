import Cookies from 'js-cookie';
import type { AuthTokens, User } from '@kasahouse/shared-types';
import { COOKIE } from './session-constants';

/**
 * Web session storage.
 *
 * The source of truth is `sessionStorage`, which is **per browser tab** — so you
 * can be signed in as different accounts in different tabs and they stay
 * independent. A copy is also mirrored to a cookie, purely so the Next.js
 * middleware (`proxy.ts`) can do a fast "is there a session?" check before a
 * protected page renders. The cookie is last-write-wins across tabs; each tab
 * keeps its own real session in `sessionStorage`.
 *
 * NOTE: tokens are stored in JS-readable places (not httpOnly). Acceptable for
 * now; a hardening pass should move the refresh token to an httpOnly cookie.
 */
export { COOKIE };

const KEY = {
  access: 'kh.at',
  refresh: 'kh.rt',
  user: 'kh.user',
} as const;

const cookieOptions: Cookies.CookieAttributes = {
  sameSite: 'lax',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

function ss(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function ssSet(key: string, value: string): void {
  try {
    ss()?.setItem(key, value);
  } catch {
    /* private mode / disabled storage */
  }
}
function ssGet(key: string): string | null {
  try {
    return ss()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function ssRemove(key: string): void {
  try {
    ss()?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Copy this tab's session into the shared cookie. The middleware reads it for a
 * fast auth gate, and a brand-new tab inherits it as a starting session (then
 * claims its own copy in sessionStorage). Last-write-wins across tabs.
 */
export function syncCookieMirror(): void {
  const access = ssGet(KEY.access);
  const refresh = ssGet(KEY.refresh);
  const user = ssGet(KEY.user);
  if (access && refresh) {
    Cookies.set(COOKIE.access, access, { ...cookieOptions, expires: 1 });
    Cookies.set(COOKIE.refresh, refresh, { ...cookieOptions, expires: 30 });
    Cookies.set(COOKIE.authed, '1', { ...cookieOptions, expires: 30 });
    if (user) Cookies.set(COOKIE.user, user, { ...cookieOptions, expires: 30 });
  }
}

export function persistSession(tokens: AuthTokens, user: User): void {
  ssSet(KEY.access, tokens.accessToken);
  ssSet(KEY.refresh, tokens.refreshToken);
  ssSet(KEY.user, JSON.stringify(user));
  syncCookieMirror();
}

export function persistTokens(tokens: AuthTokens): void {
  ssSet(KEY.access, tokens.accessToken);
  ssSet(KEY.refresh, tokens.refreshToken);
  syncCookieMirror();
}

export function persistUser(user: User): void {
  ssSet(KEY.user, JSON.stringify(user));
}

export function clearSession(): void {
  ssRemove(KEY.access);
  ssRemove(KEY.refresh);
  ssRemove(KEY.user);
  Object.values(COOKIE).forEach((name) => Cookies.remove(name, { path: '/' }));
}

export function readSession(): { tokens: AuthTokens | null; user: User | null } {
  // This tab's own session first; a brand-new tab inherits the last one via cookie.
  const access = ssGet(KEY.access) ?? Cookies.get(COOKIE.access) ?? null;
  const refresh = ssGet(KEY.refresh) ?? Cookies.get(COOKIE.refresh) ?? null;
  const userRaw = ssGet(KEY.user) ?? Cookies.get(COOKIE.user) ?? null;

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

export const getAccessToken = (): string | null =>
  ssGet(KEY.access) ?? Cookies.get(COOKIE.access) ?? null;

export const getRefreshToken = (): string | null =>
  ssGet(KEY.refresh) ?? Cookies.get(COOKIE.refresh) ?? null;
