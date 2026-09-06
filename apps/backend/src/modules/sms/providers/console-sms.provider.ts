import { Logger } from '@nestjs/common';
import type { SendSmsInput, SendSmsResult, SmsProvider } from '../sms.provider';

/**
 * Development provider. Logs the message to the server console and, for OTPs,
 * surfaces the code back through the API so the phone flow is fully testable
 * without a live SMS gateway. NEVER selected when SMS_PROVIDER != "console".
 */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';
  private readonly logger = new Logger('ConsoleSmsProvider');

  async send(input: SendSmsInput): Promise<SendSmsResult> {
    this.logger.warn(
      `[DEV SMS -> ${input.to}] (${input.purpose}) ${input.message}`,
    );

    const codeMatch =
      input.purpose === 'otp' ? input.message.match(/(\d{4,8})/) : null;

    return {
      providerMessageId: `console_${Date.now()}`,
      status: 'sent',
      providerStatus: 'ConsoleDelivered',
      devPreview: codeMatch ? codeMatch[1] : null,
    };
  }
}
