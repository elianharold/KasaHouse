/**
 * Public runtime config. `NEXT_PUBLIC_*` vars are inlined at build time and are
 * safe to read on the client. The web app talks only to the NestJS API — it
 * never connects to Postgres directly.
 *
 * Every value here is normalised so a missing, empty, or protocol-less env var
 * can never produce a string that throws when passed to `new URL()` or `fetch`.
 */
function normalizeUrl(raw: string | undefined, fallback: string): string {
  let value = (raw ?? '').trim();
  if (!value) return fallback;
  value = value.replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return value;
  } catch {
    return fallback;
  }
}

const DEFAULT_API = 'http://localhost:4000/api/v1';
const DEFAULT_SITE = 'http://localhost:3000';

const apiBaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL, DEFAULT_API);
const siteUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE);

export const env = {
  /** e.g. https://kasahouse-api.up.railway.app/api/v1 */
  apiBaseUrl: /\/api\/v\d+$/i.test(apiBaseUrl) ? apiBaseUrl : `${apiBaseUrl}/api/v1`,
  siteUrl,
  /** Parsed once; `undefined` if somehow still invalid (used for metadataBase). */
  siteUrlObject: (() => {
    try {
      return new URL(siteUrl);
    } catch {
      return undefined;
    }
  })(),
  isProd: process.env.NODE_ENV === 'production',
} as const;
