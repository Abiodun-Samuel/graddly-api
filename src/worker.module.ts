import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { BullmqWorkerModule } from './bullmq/bullmq-worker.module.js';
import { BullmqModule } from './bullmq/bullmq.module.js';
import appConfig from './config/app.config.js';
import { typeOrmForRoot } from './config/typeorm-module.factory.js';
import databaseConfig from './config/typeorm.config.js';
import { validateEnv } from './config/validate-env.js';
import { winstonConfigFactory } from './logger/winston.config.js';
import { SchedulerModule } from './scheduler/scheduler.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig],
    }),
    typeOrmForRoot(),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: winstonConfigFactory,
    }),
    BullmqModule,
    BullmqWorkerModule,
    SchedulerModule,
  ],
})
export class WorkerModule {}
