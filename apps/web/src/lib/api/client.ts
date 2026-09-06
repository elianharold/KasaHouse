'use client';

import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_ROUTES, type AuthTokens } from '@kasahouse/shared-types';
import { env } from '@/lib/env';
import { toApiError } from '@/lib/api-error';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  persistTokens,
} from '@/lib/session';
import { useAuthStore } from '@/store/auth-store';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** Browser-side API client. Server components use `serverFetch` instead. */
export const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<AuthTokens>(
      `${env.apiBaseUrl}${API_ROUTES.auth.refresh}`,
      { refreshToken },
      { timeout: 15000 },
    );
    persistTokens(data);
    useAuthStore.getState().setTokens(data);
    return data;
  } catch {
    clearSession();
    useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isRefreshCall = original?.url?.includes(API_ROUTES.auth.refresh);

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isRefreshCall &&
      getRefreshToken()
    ) {
      original._retried = true;
      refreshInFlight ??= refreshTokens().finally(() => {
        refreshInFlight = null;
      });
      const refreshed = await refreshInFlight;
      if (refreshed) {
        original.headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
        return api.request(original);
      }
      if (typeof window !== 'undefined') {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/sign-in?next=${next}`);
      }
    }

    return Promise.reject(toApiError(error));
  },
);
