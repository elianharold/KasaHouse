/**
 * SMS transport abstraction. Feature code depends only on this interface and the
 * SMS_PROVIDER injection token — never on a concrete provider — so the delivery
 * backend (Africa's Talking, Hubtel, …) can be swapped without touching auth.
 * This mirrors the PaymentProvider abstraction used later for Flutterwave.
 */
export interface SendSmsInput {
  /** E.164 recipient. */
  to: string;
  message: string;
  /** Logical category, used for logging/routing only. */
  purpose: 'otp' | 'notification';
}

export interface SendSmsResult {
  /** Provider-side message id, when the provider returns one. */
  providerMessageId: string | null;
  status: 'sent' | 'queued' | 'failed';
  /** Provider raw status string, for diagnostics. */
  providerStatus: string;
  /**
   * Dev-only: the console provider echoes the code it "sent" so the OTP flow is
   * testable without a real SMS gateway. Always null for real providers.
   */
  devPreview: string | null;
}

export interface SmsProvider {
  readonly name: string;
  send(input: SendSmsInput): Promise<SendSmsResult>;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
