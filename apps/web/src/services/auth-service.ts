import {
  API_ROUTES,
  type AuthSession,
  type AuthTokens,
  type RequestOtpPayload,
  type RequestOtpResult,
  type VerifyOtpPayload,
} from '@kasahouse/shared-types';
import { api } from '@/lib/api/client';

export const authService = {
  async requestOtp(payload: RequestOtpPayload): Promise<RequestOtpResult> {
    const { data } = await api.post<RequestOtpResult>(API_ROUTES.auth.requestOtp, payload);
    return data;
  },
  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthSession> {
    const { data } = await api.post<AuthSession>(API_ROUTES.auth.verifyOtp, payload);
    return data;
  },
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>(API_ROUTES.auth.refresh, { refreshToken });
    return data;
  },
  async logout(refreshToken: string): Promise<void> {
    await api.post(API_ROUTES.auth.logout, { refreshToken });
  },
};
