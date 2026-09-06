import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@kasahouse/shared-types';

export const ROLES_KEY = 'kasahouse:roles';

/** Route requires the caller to hold at least one of these roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
