/**
 * Email transport abstraction — same shape as the SMS provider. Feature code
 * depends only on this interface and the EMAIL_PROVIDER token.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  purpose: 'otp' | 'notification';
}

export interface SendEmailResult {
  providerMessageId: string | null;
  status: 'sent' | 'queued' | 'failed';
  providerStatus: string;
  /** Dev-only: the console provider echoes the OTP so the flow is testable. */
  devPreview: string | null;
}

export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
