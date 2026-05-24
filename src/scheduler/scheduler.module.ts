import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedisHealthIndicator } from '../health/redis-health.indicator.js';
import { RedisModule } from '../redis/redis.module.js';

import { CronLockService } from './cron-lock.service.js';
import { HealthCronService } from './health-cron.service.js';

@Module({
  imports: [
    ScheduleModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        cronJobs: config.get<boolean>('app.cron.enabled', true),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        migrationsRun: false,
        synchronize: false,
        logging: config.get<boolean>('database.logging'),
      }),
    }),
    TerminusModule,
    RedisModule,
  ],
  providers: [RedisHealthIndicator, CronLockService, HealthCronService],
  exports: [CronLockService],
})
export class SchedulerModule {}
