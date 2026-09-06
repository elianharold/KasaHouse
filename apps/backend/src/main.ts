import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import type { AppConfig } from './common/config/configuration';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { API_VERSION_PREFIX } from '@kasahouse/shared-types';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config: ConfigService<AppConfig, true> = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

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
  logger.log(`KasaHouse API listening on http://localhost:${port}/${API_VERSION_PREFIX}`);
}

void bootstrap();
