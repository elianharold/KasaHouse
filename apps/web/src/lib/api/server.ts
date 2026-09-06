import { cookies } from 'next/headers';
import { API_ROUTES, type ApiErrorBody } from '@kasahouse/shared-types';
import { env } from '@/lib/env';
import { ApiError } from '@/lib/api-error';
import { COOKIE } from '@/lib/session';

interface ServerFetchOptions {
  /** Attach the caller's access token cookie as a Bearer header. */
  auth?: boolean;
  /** Next.js fetch cache revalidation, in seconds. Default: no cache. */
  revalidate?: number | false;
  tags?: string[];
}

/**
 * Fetch from the NestJS API inside a Server Component / Route Handler.
 * Throws `ApiError` on non-2xx so pages can branch on `.status` (e.g. 404).
 */
export async function serverFetch<T>(
  path: string,
  { auth = false, revalidate = false, tags }: ServerFetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const jar = await cookies();
    const token = jar.get(COOKIE.access)?.value;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    headers,
    next:
      revalidate === false
        ? { revalidate: 0, tags }
        : { revalidate, tags },
  });

  if (!res.ok) {
    let body: Partial<ApiErrorBody> = {};
    try {
      body = (await res.json()) as Partial<ApiErrorBody>;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(
      body.error ?? 'ERROR',
      body.message ?? `Request failed (${res.status})`,
      res.status,
      body.fieldErrors,
    );
  }

  return (await res.json()) as T;
}

/** True when the request carries a session cookie (used for RSC branching). */
export async function hasServerSession(): Promise<boolean> {
  const jar = await cookies();
  return !!jar.get(COOKIE.access)?.value;
}

export const serverRoutes = API_ROUTES;
