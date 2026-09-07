import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { API_VERSION_PREFIX } from '@kasahouse/shared-types';
import type { AppConfig } from './common/config/configuration';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { AppModule } from './app.module';

/**
 * Build and configure the Nest application WITHOUT starting an HTTP listener.
 * Shared by `main.ts` (long-running server: local, Railway, Docker) and
 * `api/index.ts` (Vercel serverless function).
 */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config: ConfigService<AppConfig, true> = app.get(ConfigService);

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

  return app;
}
