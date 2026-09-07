import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { KycProvider as PrismaKycProvider } from '@prisma/client';
import type {
  KycStatusResponse,
  SubmitKycPayload,
  SubmitKycResult,
} from '@kasahouse/shared-types';
import { DomainException } from '../../common/errors/domain.exception';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KYC_PROVIDER, type KycProvider } from './kyc.provider';
import { KycRepository } from './kyc.repository';
import { toKycRecord } from './kyc.mapper';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly repo: KycRepository,
    private readonly prisma: PrismaService,
    @Inject(KYC_PROVIDER) private readonly provider: KycProvider,
  ) {}

  async getStatus(userId: string): Promise<KycStatusResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { kycStatus: true },
    });
    const latest = await this.repo.latestForUser(userId);
    return {
      status: user.kycStatus,
      latest: latest ? toKycRecord(latest) : null,
      canSubmit: user.kycStatus === 'UNVERIFIED' || user.kycStatus === 'REJECTED',
    };
  }

  async submit(userId: string, payload: SubmitKycPayload): Promise<SubmitKycResult> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { kycStatus: true },
    });

    if (user.kycStatus === 'VERIFIED') {
      throw new DomainException('KYC_ALREADY_VERIFIED', 'Your ID is already verified.');
    }
    if (user.kycStatus === 'PENDING') {
      throw new DomainException(
        'KYC_IN_PROGRESS',
        'Your previous submission is still being reviewed.',
        HttpStatus.CONFLICT,
      );
    }

    const digits = payload.idNumber.replace(/\D/g, '');
    const record = await this.repo.create({
      userId,
      provider: this.providerEnum(),
      status: 'PENDING',
      idType: payload.idType,
      idNumberLast4: digits.length >= 4 ? digits.slice(-4) : null,
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: 'PENDING' },
    });

    const decision = await this.provider.submit({
      userId,
      idType: payload.idType,
      idNumber: payload.idNumber,
      fullName: payload.fullName,
      dateOfBirth: payload.dateOfBirth,
      frontImage: payload.frontImage,
      selfieImage: payload.selfieImage,
    });

    if (decision.providerRef) {
      await this.prisma.kycRecord.update({
        where: { id: record.id },
        data: { providerRef: decision.providerRef },
      });
    }

    const settled = await this.repo.settle({
      recordId: record.id,
      userId,
      status: decision.status,
      rejectionReason: decision.rejectionReason,
    });

    this.logger.log(`KYC ${userId} -> ${decision.status}`);
    return {
      status: decision.status,
      record: toKycRecord(settled),
      devNote: decision.devNote,
    };
  }

  async handleWebhook(
    headers: Record<string, string | undefined>,
    rawBody: string,
  ): Promise<void> {
    const result = this.provider.parseWebhook(headers, rawBody);
    const record = await this.repo.findByProviderRef(result.providerRef);
    if (!record) {
      this.logger.warn(`KYC webhook for unknown ref ${result.providerRef}`);
      return;
    }
    await this.repo.settle({
      recordId: record.id,
      userId: record.userId,
      status: result.status,
      rejectionReason: result.rejectionReason,
    });
    this.logger.log(`KYC webhook: ${record.userId} -> ${result.status}`);
  }

  private providerEnum(): PrismaKycProvider {
    return this.provider.name === 'smile_id' ? 'SMILE_ID' : 'CONSOLE';
  }
}
