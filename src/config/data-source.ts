import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'graddly',
  password: process.env.DB_PASSWORD || 'graddly',
  database: process.env.DB_NAME || 'graddly',
  entities: [__dirname + '/../**/*.entity.js'],
  migrations: [__dirname + '/../migrations/*.js'],
});
