import { Injectable } from '@nestjs/common';
import type { KycRecord, KycStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class KycRepository {
  constructor(private readonly prisma: PrismaService) {}

  latestForUser(userId: string): Promise<KycRecord | null> {
    return this.prisma.kycRecord.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  create(data: Prisma.KycRecordUncheckedCreateInput): Promise<KycRecord> {
    return this.prisma.kycRecord.create({ data });
  }

  findByProviderRef(providerRef: string): Promise<KycRecord | null> {
    return this.prisma.kycRecord.findFirst({ where: { providerRef } });
  }

  /** Update the record and mirror the status onto the user in one transaction. */
  async settle(params: {
    recordId: string;
    userId: string;
    status: KycStatus;
    rejectionReason: string | null;
  }): Promise<KycRecord> {
    const [record] = await this.prisma.$transaction([
      this.prisma.kycRecord.update({
        where: { id: params.recordId },
        data: {
          status: params.status,
          rejectionReason: params.rejectionReason,
          decidedAt:
            params.status === 'VERIFIED' || params.status === 'REJECTED'
              ? new Date()
              : null,
        },
      }),
      this.prisma.user.update({
        where: { id: params.userId },
        data: { kycStatus: params.status },
      }),
    ]);
    return record;
  }
}
