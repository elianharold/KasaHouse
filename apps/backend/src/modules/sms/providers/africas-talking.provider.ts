import { Logger } from '@nestjs/common';
import AfricasTalking from 'africastalking';
import type { AppConfig } from '../../../common/config/configuration';
import { DomainException } from '../../../common/errors/domain.exception';
import type { SendSmsInput, SendSmsResult, SmsProvider } from '../sms.provider';

/**
 * Real SMS delivery via the official Africa's Talking Node.js SDK.
 * Docs: https://developers.africastalking.com/docs/sms/overview
 * Sandbox note from the SDK README: the username is ALWAYS "sandbox".
 */
export class AfricasTalkingSmsProvider implements SmsProvider {
  readonly name = 'africastalking';
  private readonly logger = new Logger('AfricasTalkingSmsProvider');
  private readonly client: ReturnType<typeof AfricasTalking>;
  private readonly senderId: string | null;

  constructor(config: AppConfig['sms']['africasTalking']) {
    if (!config.apiKey) {
      throw new Error('AT_API_KEY is required for the Africa\'s Talking SMS provider');
    }
    // In sandbox the username must be exactly "sandbox".
    const username = config.env === 'sandbox' ? 'sandbox' : config.username;
    this.client = AfricasTalking({ apiKey: config.apiKey, username });
    this.senderId = config.senderId;
  }

  async send(input: SendSmsInput): Promise<SendSmsResult> {
    try {
      const response = await this.client.SMS.send({
        to: input.to,
        message: input.message,
        ...(this.senderId ? { from: this.senderId } : {}),
      });

      const recipient = response.SMSMessageData.Recipients[0];
      if (!recipient) {
        this.logger.error(
          `Africa's Talking accepted no recipients: ${response.SMSMessageData.Message}`,
        );
        throw new DomainException(
          'SMS_SEND_FAILED',
          'We could not send the code right now. Please try again shortly.',
        );
      }

      // 100 = Processed, 101 = Sent, 102 = Queued — anything else is a failure.
      const ok = [100, 101, 102].includes(recipient.statusCode);
      return {
        providerMessageId: recipient.messageId || null,
        status: recipient.statusCode === 102 ? 'queued' : ok ? 'sent' : 'failed',
        providerStatus: recipient.status,
        devPreview: null,
      };
    } catch (error) {
      if (error instanceof DomainException) throw error;
      this.logger.error(
        'Africa\'s Talking SMS send threw',
        error instanceof Error ? error.stack : String(error),
      );
      throw new DomainException(
        'SMS_SEND_FAILED',
        'We could not send the code right now. Please try again shortly.',
      );
    }
  }
}
