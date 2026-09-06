import type { User as PrismaUser } from '@prisma/client';
import type {
  KycStatus,
  PublicUserProfile,
  User,
  UserRole,
} from '@kasahouse/shared-types';

export const toUser = (row: PrismaUser): User => ({
  id: row.id,
  phone: row.phone,
  fullName: row.fullName,
  roles: row.roles as UserRole[],
  kycStatus: row.kycStatus as KycStatus,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toPublicUserProfile = (
  row: Pick<PrismaUser, 'id' | 'fullName' | 'roles' | 'createdAt'>,
): PublicUserProfile => ({
  id: row.id,
  fullName: row.fullName,
  roles: row.roles as UserRole[],
  memberSince: row.createdAt.toISOString(),
});
