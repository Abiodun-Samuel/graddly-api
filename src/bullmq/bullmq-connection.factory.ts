import { ConfigService } from '@nestjs/config';

import type { ConnectionOptions } from 'bullmq';

/** BullMQ requires blocking commands; do not reuse the app KV Redis client. */
export function createBullMqConnectionOptions(
  config: ConfigService,
): ConnectionOptions {
  return {
    host: config.get<string>('app.redis.host', 'localhost'),
    port: config.get<number>('app.redis.port', 6379),
    password: config.get<string>('app.redis.password'),
    family: 0,
    maxRetriesPerRequest: null,
  };
}
