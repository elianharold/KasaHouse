import { Logger } from '@nestjs/common';
import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../email.provider';

/** Development provider — logs the email and surfaces any OTP back through the API. */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';
  private readonly logger = new Logger('ConsoleEmailProvider');

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    this.logger.warn(
      `[DEV EMAIL -> ${input.to}] (${input.purpose}) ${input.subject}\n${input.text}`,
    );
    const codeMatch =
      input.purpose === 'otp' ? input.text.match(/(\d{4,8})/) : null;

    return {
      providerMessageId: `console_${Date.now()}`,
      status: 'sent',
      providerStatus: 'ConsoleDelivered',
      devPreview: codeMatch ? codeMatch[1] : null,
    };
  }
}
