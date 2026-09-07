import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<AppConfig, true>) {
    // The pooled connection string (Neon "-pooler" host) — the pg driver adapter
    // manages its own small pool, sized for serverless.
    const connectionString = config.get('databaseUrl', { infer: true });
    super({ adapter: new PrismaPg({ connectionString, max: 3 }) });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL (pg driver adapter)');
    } catch (error) {
      this.logger.error(
        'Could not connect to the database. Is Postgres running and DATABASE_URL correct?',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
