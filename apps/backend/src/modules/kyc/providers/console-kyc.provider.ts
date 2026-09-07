import { Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DomainException } from '../../../common/errors/domain.exception';
import type {
  KycDecision,
  KycProvider,
  KycSubmission,
  KycWebhookResult,
} from '../kyc.provider';

/**
 * Development provider — decides synchronously so the KYC flow is testable end
 * to end without a paid vendor. Approves everything, EXCEPT a Ghana Card number
 * whose digits end in "00", which is rejected (so both branches are testable).
 */
export class ConsoleKycProvider implements KycProvider {
  readonly name = 'console' as const;
  private readonly logger = new Logger('ConsoleKycProvider');

  async submit(input: KycSubmission): Promise<KycDecision> {
    const digits = input.idNumber.replace(/\D/g, '');
    const reject = digits.endsWith('00');

    this.logger.warn(
      `[DEV KYC] ${input.userId} submitted ${input.idType} — auto-${
        reject ? 'REJECTED' : 'VERIFIED'
      }`,
    );

    return reject
      ? {
          status: 'REJECTED',
          providerRef: `console_${randomBytes(6).toString('hex')}`,
          rejectionReason:
            'We could not match this ID. Check the number and that the photo is clear, then try again.',
          devNote: 'Console provider rejects any ID number ending in "00".',
        }
      : {
          status: 'VERIFIED',
          providerRef: `console_${randomBytes(6).toString('hex')}`,
          rejectionReason: null,
          devNote: 'Console provider auto-verifies. Real checks use Smile ID.',
        };
  }

  parseWebhook(): KycWebhookResult {
    throw new DomainException(
      'KYC_WEBHOOK_UNSUPPORTED',
      'The console KYC provider does not use webhooks.',
      400,
    );
  }
}
