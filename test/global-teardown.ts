import * as path from 'path';

import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import { Client } from 'pg';

dotenv.config({
  path: path.resolve(__dirname, '..', '.env.test'),
  override: true,
});

export default async function globalTeardown(): Promise<void> {
  const pg = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'graddly',
    password: process.env.DB_PASSWORD || 'graddly',
    database: process.env.DB_NAME || 'graddly_test',
  });

  await pg.connect();

  const tables = await pg.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'migrations'`,
  );

  for (const { tablename } of tables.rows) {
    await pg.query(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`);
  }

  await pg.end();

  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  });

  await redis.flushall();
  await redis.quit();
}
