import { Logger } from '@nestjs/common';
import { DomainException } from '../../../common/errors/domain.exception';
import type {
  KycDecision,
  KycProvider,
  KycSubmission,
  KycWebhookResult,
} from '../kyc.provider';

/**
 * Real Ghana Card verification via Smile ID.
 *
 * NOT IMPLEMENTED YET — this is a wired placeholder so `KYC_PROVIDER=smileid`
 * has a home. The real integration must follow Smile ID's official docs
 * (https://docs.usesmileid.com) for: partner auth (signature), the
 * document-verification / biometric-KYC job type, and webhook signature
 * verification. Until then the app runs with `KYC_PROVIDER=console`.
 */
export class SmileIdKycProvider implements KycProvider {
  readonly name = 'smile_id' as const;
  private readonly logger = new Logger('SmileIdKycProvider');

  constructor(_config: {
    partnerId: string;
    apiKey: string;
    env: 'sandbox' | 'production';
    callbackUrl: string;
  }) {
    void _config;
    this.logger.warn(
      'Smile ID provider selected but not implemented — set KYC_PROVIDER=console until the integration lands.',
    );
  }

  async submit(_input: KycSubmission): Promise<KycDecision> {
    throw new DomainException(
      'KYC_PROVIDER_UNAVAILABLE',
      'Identity verification is temporarily unavailable. Please try again later.',
      503,
    );
  }

  parseWebhook(_headers: Record<string, string | undefined>, _rawBody: string): KycWebhookResult {
    throw new DomainException(
      'KYC_PROVIDER_UNAVAILABLE',
      'Identity verification is temporarily unavailable.',
      503,
    );
  }
}
