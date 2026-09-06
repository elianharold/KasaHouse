// Minimal typings for the official `africastalking` SDK (no bundled types).
// Covers only the SMS surface KasaHouse uses. See:
// https://github.com/AfricasTalkingLtd/africastalking-node.js
declare module 'africastalking' {
  interface Credentials {
    apiKey: string;
    /** For the sandbox this is ALWAYS "sandbox". */
    username: string;
  }

  interface SendSmsOptions {
    to: string | string[];
    message: string;
    /** Registered shortcode / alphanumeric sender id. */
    from?: string;
    senderId?: string;
    enqueue?: boolean;
  }

  interface SmsRecipient {
    statusCode: number;
    number: string;
    status: string;
    cost: string;
    messageId: string;
  }

  interface SendSmsResponse {
    SMSMessageData: {
      Message: string;
      Recipients: SmsRecipient[];
    };
  }

  interface SmsService {
    send(options: SendSmsOptions): Promise<SendSmsResponse>;
  }

  interface AfricasTalkingClient {
    SMS: SmsService;
  }

  function AfricasTalking(credentials: Credentials): AfricasTalkingClient;
  export = AfricasTalking;
}
