import { AxiosError } from 'axios';
import type { ApiErrorBody } from '@kasahouse/shared-types';

/**
 * Normalised error every hook/screen can rely on. `code` is the backend's
 * stable machine code (e.g. "OTP_EXPIRED") or one of the synthetic codes below
 * for transport-level failures.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string[]>,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetwork(): boolean {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT';
  }

  get isAuth(): boolean {
    return this.status === 401;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError('TIMEOUT', 'The request took too long. Check your connection and try again.', 0);
    }
    if (!error.response) {
      return new ApiError('NETWORK', 'You appear to be offline. Check your connection and try again.', 0);
    }
    const body = error.response.data as Partial<ApiErrorBody> | undefined;
    return new ApiError(
      body?.error ?? 'ERROR',
      body?.message ?? 'Something went wrong. Please try again.',
      error.response.status,
      body?.fieldErrors,
      (body as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds,
    );
  }

  return new ApiError(
    'UNKNOWN',
    error instanceof Error ? error.message : 'Something went wrong. Please try again.',
    0,
  );
};
