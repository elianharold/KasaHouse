import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../common/config/configuration';
import { EMAIL_PROVIDER, type EmailProvider } from './email.provider';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): EmailProvider => {
        const email = config.get('email', { infer: true });
        const logger = new Logger('EmailModule');

        if (email.provider === 'resend') {
          logger.log(`Email provider: Resend (from ${email.from})`);
          return new ResendEmailProvider(email.resendApiKey, email.from);
        }

        logger.warn(
          'Email provider: console (development only — codes are logged and returned by the API)',
        );
        return new ConsoleEmailProvider();
      },
    },
  ],
  exports: [EMAIL_PROVIDER],
})
export class EmailModule {}
