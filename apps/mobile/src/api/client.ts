import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_ROUTES, type AuthTokens } from '@kasahouse/shared-types';
import { env } from '../config/env';
import { toApiError } from '../lib/api-error';
import { getAccessToken, getRefreshToken, useAuthStore } from '../store/auth-store';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// ── single-flight refresh ───────────────────────────────────────
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
    useAuthStore.getState().setTokens(data);
    return data;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes(API_ROUTES.auth.refresh);

    if (status === 401 && original && !original._retried && !isRefreshCall && getRefreshToken()) {
      original._retried = true;
      refreshInFlight ??= refreshTokens().finally(() => {
        refreshInFlight = null;
      });
      const refreshed = await refreshInFlight;
      if (refreshed) {
        original.headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
        return api.request(original);
      }
    }

    return Promise.reject(toApiError(error));
  },
);
