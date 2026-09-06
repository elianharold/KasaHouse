/**
 * Public runtime config. `NEXT_PUBLIC_*` vars are inlined at build time and are
 * safe to read on the client. The web app talks only to the NestJS API — it
 * never connects to Postgres directly.
 */
const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const env = {
  /** e.g. https://kasahouse-api.up.railway.app/api/v1 */
  apiBaseUrl: rawBase.replace(/\/$/, ''),
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  isProd: process.env.NODE_ENV === 'production',
} as const;
