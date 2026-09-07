import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { API_VERSION_PREFIX } from '@kasahouse/shared-types';
import type { AppConfig } from './common/config/configuration';
import { createApp } from './bootstrap';

/** Long-running server entrypoint (local dev, Railway, Docker). */
async function main(): Promise<void> {
  const app = await createApp();
  app.enableShutdownHooks();

  const config: ConfigService<AppConfig, true> = app.get(ConfigService);
  const port = config.get('port', { infer: true });

  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(
    `KasaHouse API listening on http://localhost:${port}/${API_VERSION_PREFIX}`,
  );
}

void main();
