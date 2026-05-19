import 'dotenv/config';
import './env-bootstrap.js';
import 'reflect-metadata';

import '../database/postgres-query-runner.patch.js';

import { DataSource } from 'typeorm';

import { getEnv } from './validate-env.js';

const e = getEnv();

/** Migrator credentials for CLI; falls back to app DB_* when unset. */
const migrationUsername =
  process.env.DB_MIGRATION_USERNAME?.trim() || e.DB_USERNAME;
const migrationPassword = process.env.DB_MIGRATION_PASSWORD ?? e.DB_PASSWORD;

export default new DataSource({
  type: 'postgres',
  host: e.DB_HOST,
  port: e.DB_PORT,
  username: migrationUsername,
  password: migrationPassword,
  database: e.DB_NAME,
  entities: [__dirname + '/../**/*.entity.js'],
  migrations: [__dirname + '/../migrations/*.js'],
});
