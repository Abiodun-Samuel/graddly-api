import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { BullmqWorkerModule } from './bullmq/bullmq-worker.module.js';
import { BullmqModule } from './bullmq/bullmq.module.js';
import appConfig from './config/app.config.js';
import { validateEnv } from './config/validate-env.js';
import { winstonConfigFactory } from './logger/winston.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig],
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: winstonConfigFactory,
    }),
    BullmqModule,
    BullmqWorkerModule,
  ],
})
export class WorkerModule {}
