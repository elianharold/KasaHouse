import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { DomainException } from '../../../common/errors/domain.exception';
import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../email.provider';

/**
 * Real email delivery via the official Resend Node SDK.
 * Docs: https://resend.com/docs/send-with-nodejs
 * The `from` address must be on a domain verified in the Resend dashboard
 * (the shared `onboarding@resend.dev` sender works only for testing).
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  private readonly logger = new Logger('ResendEmailProvider');
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    if (!apiKey) throw new Error('RESEND_API_KEY is required for the Resend email provider');
    this.client = new Resend(apiKey);
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      if (error) {
        this.logger.error(`Resend rejected the email: ${error.name} — ${error.message}`);
        // The shared testing sender (onboarding@resend.dev) only delivers to the
        // Resend account owner. Surface that clearly instead of a generic error.
        const testingRestriction =
          /testing emails to your own email|verify a domain/i.test(error.message);
        throw new DomainException(
          'EMAIL_SEND_FAILED',
          testingRestriction
            ? 'Email is in Resend test mode and can only reach the account owner. Verify a domain in Resend, or set EMAIL_PROVIDER=console for testing.'
            : `Email could not be sent: ${error.message}`,
        );
      }

      return {
        providerMessageId: data?.id ?? null,
        status: 'sent',
        providerStatus: 'Accepted',
        devPreview: null,
      };
    } catch (error) {
      if (error instanceof DomainException) throw error;
      this.logger.error(
        'Resend email send threw',
        error instanceof Error ? error.stack : String(error),
      );
      throw new DomainException(
        'EMAIL_SEND_FAILED',
        'We could not send the email right now. Please try again shortly.',
      );
    }
  }
}
