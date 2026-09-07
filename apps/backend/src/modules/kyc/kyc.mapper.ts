import type { KycRecord as PrismaKycRecord } from '@prisma/client';
import type { KycIdType, KycRecord, KycStatus } from '@kasahouse/shared-types';

export const toKycRecord = (row: PrismaKycRecord): KycRecord => ({
  id: row.id,
  status: row.status as KycStatus,
  idType: row.idType as KycIdType,
  idNumberLast4: row.idNumberLast4,
  rejectionReason: row.rejectionReason,
  submittedAt: row.submittedAt.toISOString(),
  decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
});
