import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DasModule } from '../das/das.module.js';
import { RedisHealthIndicator } from '../health/redis-health.indicator.js';
import { Organisation } from '../organisations/entities/organisation.entity.js';
import { OtjModule } from '../otj/otj.module.js';
import { RedisModule } from '../redis/redis.module.js';

import { CronLockService } from './cron-lock.service.js';
import { DasSyncCronService } from './das-sync-cron.service.js';
import { DigestCronService } from './digest-cron.service.js';
import { HealthCronService } from './health-cron.service.js';
import { OtjPaceCronService } from './otj-pace-cron.service.js';

@Module({
  imports: [
    ScheduleModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        cronJobs: config.get<boolean>('app.cron.enabled', true),
      }),
    }),
    TerminusModule,
    RedisModule,
    DasModule,
    OtjModule,
    TypeOrmModule.forFeature([Organisation]),
  ],
  providers: [
    RedisHealthIndicator,
    CronLockService,
    HealthCronService,
    DigestCronService,
    DasSyncCronService,
    OtjPaceCronService,
  ],
  exports: [CronLockService],
})
export class SchedulerModule {}
