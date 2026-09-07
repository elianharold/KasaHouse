import type { ISODateString } from './common';
import type { KycStatus } from './user';

export const KycIdType = {
  GHANA_CARD: 'GHANA_CARD',
} as const;
export type KycIdType = (typeof KycIdType)[keyof typeof KycIdType];

export interface KycRecord {
  id: string;
  status: KycStatus;
  idType: KycIdType;
  /** Last 4 digits only — the full Ghana Card number is never returned. */
  idNumberLast4: string | null;
  rejectionReason: string | null;
  submittedAt: ISODateString;
  decidedAt: ISODateString | null;
}

export interface KycStatusResponse {
  status: KycStatus;
  /** The most recent submission, if any. */
  latest: KycRecord | null;
  /** True when a fresh submission is allowed (UNVERIFIED or REJECTED). */
  canSubmit: boolean;
}

export interface SubmitKycPayload {
  idType: KycIdType;
  /** Ghana Card number, e.g. GHA-XXXXXXXXX-X. Only the last 4 are stored. */
  idNumber: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  /**
   * Data URLs (base64) of the captured images. The console provider ignores
   * these; a real provider (Smile ID) uploads them.
   */
  frontImage?: string;
  selfieImage?: string;
}

export interface SubmitKycResult {
  status: KycStatus;
  record: KycRecord;
  /** Populated only by the console/dev provider so the flow is testable. */
  devNote?: string;
}
