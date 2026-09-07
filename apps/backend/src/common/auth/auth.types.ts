import type { KycStatus, UserRole } from '@kasahouse/shared-types';

/** Attached to `request.user` after the JWT guard runs. */
export interface AuthenticatedUser {
  id: string;
  phone: string | null;
  email: string | null;
  roles: UserRole[];
  kycStatus: KycStatus;
}
