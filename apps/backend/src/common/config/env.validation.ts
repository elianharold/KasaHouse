import { loadConfiguration } from './configuration';

/**
 * Fail fast at boot if the environment is not usable. Only hard requirements
 * are enforced here; optional integrations (Cloudinary, Africa's Talking) are
 * checked lazily by their providers so Phase 1 can run without them.
 */
export const validateEnv = (): ReturnType<typeof loadConfiguration> => {
  const config = loadConfiguration();
  const errors: string[] = [];

  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is required');
  } else if (!/^postgres(ql)?:\/\//.test(config.databaseUrl)) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string');
  }

  if (!config.jwt.accessSecret || config.jwt.accessSecret.length < 16) {
    errors.push('JWT_ACCESS_SECRET is required (>= 16 chars)');
  }
  if (!config.jwt.refreshSecret || config.jwt.refreshSecret.length < 16) {
    errors.push('JWT_REFRESH_SECRET is required (>= 16 chars)');
  }
  if (config.jwt.accessSecret === config.jwt.refreshSecret) {
    errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
  }

  if (config.sms.provider === 'africastalking' && !config.sms.africasTalking.apiKey) {
    errors.push('AT_API_KEY is required when SMS_PROVIDER=africastalking');
  }

  if (config.email.provider === 'resend' && !config.email.resendApiKey) {
    errors.push('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
  }

  if (
    config.kyc.provider === 'smileid' &&
    (!config.kyc.smileId.partnerId || !config.kyc.smileId.apiKey)
  ) {
    errors.push(
      'SMILE_ID_PARTNER_ID and SMILE_ID_API_KEY are required when KYC_PROVIDER=smileid',
    );
  }

  if (config.otp.length < 4 || config.otp.length > 8) {
    errors.push('OTP_LENGTH must be between 4 and 8');
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n  - ${errors.join('\n  - ')}`,
    );
  }

  return config;
};
