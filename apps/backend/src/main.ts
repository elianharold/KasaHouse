import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { API_VERSION_PREFIX } from '@kasahouse/shared-types';
import type { AppConfig } from './common/config/configuration';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { AppModule } from './app.module';

/**
 * Entrypoint for every target:
 *  - local dev / Railway / Docker: runs as a long-lived HTTP server
 *  - Vercel: detected as a NestJS app (it looks for this `@nestjs/core` import)
 *    and wrapped as a single Fluid-compute function
 *
 * Vercel's detector requires the `NestFactory` import and the `app.listen()`
 * call to live in this file, so the bootstrap logic is kept inline here.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
    rawBody: true, // needed to verify KYC / payment webhook signatures
  });
  const config: ConfigService<AppConfig, true> = app.get(ConfigService);

  // KYC submissions carry base64 ID photos.
  app.useBodyParser('json', { limit: '12mb' });
  app.useBodyParser('urlencoded', { limit: '12mb', extended: true });

  app.use(helmet());
  app.setGlobalPrefix(API_VERSION_PREFIX);

  const corsOrigins = config.get('corsOrigins', { infer: true });
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = config.get('port', { infer: true });
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(
    `KasaHouse API listening on http://localhost:${port}/${API_VERSION_PREFIX}`,
  );
}

void bootstrap();
