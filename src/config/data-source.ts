import 'dotenv/config';
import './env-bootstrap.js';
import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { TenantSessionSubscriber } from '../database/tenant-session.subscriber.js';

import { getEnv } from './validate-env.js';

const e = getEnv();

export default new DataSource({
  type: 'postgres',
  host: e.DB_HOST,
  port: e.DB_PORT,
  username: e.DB_USERNAME,
  password: e.DB_PASSWORD,
  database: e.DB_NAME,
  entities: [__dirname + '/../**/*.entity.js'],
  migrations: [__dirname + '/../migrations/*.js'],
  subscribers: [TenantSessionSubscriber],
});
