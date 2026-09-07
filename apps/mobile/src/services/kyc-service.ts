import {
  API_ROUTES,
  type KycStatusResponse,
  type SubmitKycPayload,
  type SubmitKycResult,
} from '@kasahouse/shared-types';
import { api } from '../api/client';

export const kycService = {
  async getStatus(): Promise<KycStatusResponse> {
    const { data } = await api.get<KycStatusResponse>(API_ROUTES.kyc.status);
    return data;
  },
  async submit(payload: SubmitKycPayload): Promise<SubmitKycResult> {
    const { data } = await api.post<SubmitKycResult>(API_ROUTES.kyc.submit, payload);
    return data;
  },
};
