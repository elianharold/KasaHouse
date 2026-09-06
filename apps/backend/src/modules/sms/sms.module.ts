import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../common/config/configuration';
import { AfricasTalkingSmsProvider } from './providers/africas-talking.provider';
import { ConsoleSmsProvider } from './providers/console-sms.provider';
import { SMS_PROVIDER, type SmsProvider } from './sms.provider';

@Global()
@Module({
  providers: [
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): SmsProvider => {
        const sms = config.get('sms', { infer: true });
        const logger = new Logger('SmsModule');

        if (sms.provider === 'africastalking') {
          logger.log('SMS provider: Africa\'s Talking');
          return new AfricasTalkingSmsProvider(sms.africasTalking);
        }

        logger.warn(
          'SMS provider: console (development only — OTP codes are logged and returned by the API)',
        );
        return new ConsoleSmsProvider();
      },
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
