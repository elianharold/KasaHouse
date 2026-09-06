/**
 * Cookie names only — no imports. Safe to use from Edge middleware (`proxy.ts`)
 * and Node server code without pulling in the browser-only `js-cookie`.
 */
export const COOKIE = {
  access: 'kh_at',
  refresh: 'kh_rt',
  user: 'kh_user',
  authed: 'kh_authed',
} as const;
