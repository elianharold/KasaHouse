import type { ISODateString } from './common';

export const UserRole = {
  LANDLORD: 'LANDLORD',
  TENANT: 'TENANT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALL_USER_ROLES: UserRole[] = [UserRole.LANDLORD, UserRole.TENANT];

/**
 * Tenant/buyer-side identity verification state.
 * A landlord's contact info and chat thread stay locked until this is VERIFIED.
 * (KYC provider integration lands in Phase 2 — the field and states exist now.)
 */
export const KycStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type KycStatus = (typeof KycStatus)[keyof typeof KycStatus];

export interface User {
  id: string;
  /** E.164, e.g. +233201234567. Null for accounts created with email only. */
  phone: string | null;
  /** Null for accounts created with phone only. */
  email: string | null;
  fullName: string | null;
  /** True once the account has set a password (enables the fast email+password login). */
  hasPassword: boolean;
  /** A single account can hold both roles. */
  roles: UserRole[];
  kycStatus: KycStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Shape exposed about another user (e.g. a listing owner) before contact is unlocked. */
export interface PublicUserProfile {
  id: string;
  fullName: string | null;
  roles: UserRole[];
  memberSince: ISODateString;
}

export interface UpdateProfilePayload {
  fullName?: string;
  /** Link an email to the account (enables password login + email codes). */
  email?: string;
  /** Add a role the account does not yet hold. Cannot remove the last role. */
  addRole?: UserRole;
}
