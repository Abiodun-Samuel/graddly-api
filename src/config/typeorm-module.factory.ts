import { join } from 'node:path';

import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

/** Nest build output root (`dist/src` at runtime). */
const SRC_ROOT = join(__dirname, '..');

export interface ITypeOrmModuleFactoryOptions {
  migrationsRun?: boolean;
}

export function createTypeOrmModuleOptions(
  config: ConfigService,
  options: ITypeOrmModuleFactoryOptions = {},
): TypeOrmModuleOptions {
  const { migrationsRun = false } = options;
  const database = config.get<TypeOrmModuleOptions>('database');

  if (!database) {
    throw new Error('Database configuration is missing');
  }

  return {
    ...database,
    entities: [`${SRC_ROOT}/**/*.entity{.ts,.js}`],
    subscribers: [`${SRC_ROOT}/**/*.subscriber{.ts,.js}`],
    migrations: [`${SRC_ROOT}/migrations/*{.ts,.js}`],
    migrationsRun,
    synchronize: false,
  };
}

export function typeOrmForRoot(options: ITypeOrmModuleFactoryOptions = {}) {
  return TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) =>
      createTypeOrmModuleOptions(config, options),
  });
}
