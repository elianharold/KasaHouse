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
        throw new DomainException(
          'EMAIL_SEND_FAILED',
          'We could not send the email right now. Please try again shortly.',
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
