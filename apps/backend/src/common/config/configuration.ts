/**
 * Typed configuration loaded once at boot. Feature code reads these via
 * ConfigService<AppConfig> so there are no scattered `process.env` reads.
 */
export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  corsOrigins: string[];
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: number;
    refreshTtl: number;
  };
  otp: {
    length: number;
    ttlSeconds: number;
    resendCooldownSeconds: number;
    maxVerifyAttempts: number;
    /** Extra secret mixed into the code hash so a DB leak can't reverse codes. */
    pepper: string;
  };
  sms: {
    provider: 'console' | 'africastalking';
    africasTalking: {
      username: string;
      apiKey: string;
      senderId: string | null;
      env: 'sandbox' | 'production';
    };
  };
  email: {
    provider: 'console' | 'resend';
    from: string;
    resendApiKey: string;
  };
  auth: {
    /** Minimum length for a user-set password. */
    minPasswordLength: number;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    imagePreset: string;
    videoPreset: string;
  };
  sentryDsn: string | null;
}

const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

/**
 * The pooled Postgres connection string. Prefer DATABASE_URL, but also accept
 * the names Vercel's Neon integration injects so the app works without having
 * to hand-copy a variable.
 */
const resolveDatabaseUrl = (): string =>
  process.env.DATABASE_URL ||
  process.env.DATABASE_POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  '';

export const loadConfiguration = (): AppConfig => ({
  nodeEnv: (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development',
  port: int(process.env.PORT, 4000),
  corsOrigins: list(process.env.CORS_ORIGINS),
  databaseUrl: resolveDatabaseUrl(),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessTtl: int(process.env.JWT_ACCESS_TTL, 900),
    refreshTtl: int(process.env.JWT_REFRESH_TTL, 2_592_000),
  },
  otp: {
    length: int(process.env.OTP_LENGTH, 6),
    ttlSeconds: int(process.env.OTP_TTL_SECONDS, 300),
    resendCooldownSeconds: int(process.env.OTP_RESEND_COOLDOWN_SECONDS, 45),
    maxVerifyAttempts: int(process.env.OTP_MAX_VERIFY_ATTEMPTS, 5),
    pepper: process.env.JWT_ACCESS_SECRET ?? 'kasahouse-otp-pepper',
  },
  sms: {
    provider: (process.env.SMS_PROVIDER as AppConfig['sms']['provider']) || 'console',
    africasTalking: {
      username: process.env.AT_USERNAME ?? 'sandbox',
      apiKey: process.env.AT_API_KEY ?? '',
      senderId: process.env.AT_SENDER_ID ? process.env.AT_SENDER_ID : null,
      env: (process.env.AT_ENV as 'sandbox' | 'production') || 'sandbox',
    },
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER as AppConfig['email']['provider']) || 'console',
    from: process.env.EMAIL_FROM ?? 'KasaHouse <onboarding@resend.dev>',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
  },
  auth: {
    minPasswordLength: int(process.env.AUTH_MIN_PASSWORD_LENGTH, 8),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
    imagePreset: process.env.CLOUDINARY_IMAGE_PRESET ?? 'kasahouse_listing_image',
    videoPreset: process.env.CLOUDINARY_VIDEO_PRESET ?? 'kasahouse_listing_video',
  },
  sentryDsn: process.env.SENTRY_DSN ? process.env.SENTRY_DSN : null,
});
