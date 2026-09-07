import type { KycStatus } from '@kasahouse/shared-types';

/**
 * Identity-verification transport abstraction — same pattern as SMS/Email.
 * Feature code depends only on this interface and the KYC_PROVIDER token, so
 * Smile ID (or another vendor) can be swapped in without touching the KYC or
 * chat flows.
 */
export interface KycSubmission {
  userId: string;
  idType: string;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  frontImage?: string;
  selfieImage?: string;
}

export interface KycDecision {
  /** VERIFIED / REJECTED for synchronous providers, PENDING when a webhook will follow. */
  status: Extract<KycStatus, 'PENDING' | 'VERIFIED' | 'REJECTED'>;
  providerRef: string | null;
  rejectionReason: string | null;
  /** Dev-only note surfaced by the console provider. */
  devNote?: string;
}

export interface KycWebhookResult {
  providerRef: string;
  status: Extract<KycStatus, 'VERIFIED' | 'REJECTED'>;
  rejectionReason: string | null;
}

export interface KycProvider {
  readonly name: 'console' | 'smile_id';
  submit(input: KycSubmission): Promise<KycDecision>;
  /** Parse + verify a provider webhook. Throws if the signature is invalid. */
  parseWebhook(headers: Record<string, string | undefined>, rawBody: string): KycWebhookResult;
}

export const KYC_PROVIDER = Symbol('KYC_PROVIDER');
