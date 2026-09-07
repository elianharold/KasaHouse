import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../common/config/configuration';
import { KycController } from './kyc.controller';
import { KYC_PROVIDER, type KycProvider } from './kyc.provider';
import { KycRepository } from './kyc.repository';
import { KycService } from './kyc.service';
import { ConsoleKycProvider } from './providers/console-kyc.provider';
import { SmileIdKycProvider } from './providers/smile-id.provider';

@Global()
@Module({
  controllers: [KycController],
  providers: [
    KycService,
    KycRepository,
    {
      provide: KYC_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): KycProvider => {
        const kyc = config.get('kyc', { infer: true });
        const logger = new Logger('KycModule');

        if (kyc.provider === 'smileid') {
          logger.log('KYC provider: Smile ID');
          return new SmileIdKycProvider(kyc.smileId);
        }

        logger.warn(
          'KYC provider: console (development only — submissions are auto-decided)',
        );
        return new ConsoleKycProvider();
      },
    },
  ],
  exports: [KycService],
})
export class KycModule {}
