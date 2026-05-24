import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { createBullMqConnectionOptions } from './bullmq-connection.factory.js';
import { bullmqDefaultJobOptions } from './bullmq-default-job-options.js';
import { BULLMQ_QUEUES } from './bullmq.constants.js';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: createBullMqConnectionOptions(config),
        prefix: config.get<string>('app.bullmq.prefix', 'graddly'),
        defaultJobOptions: bullmqDefaultJobOptions,
      }),
    }),
    BullModule.registerQueue(...BULLMQ_QUEUES.map((name) => ({ name }))),
  ],
  exports: [BullModule],
})
export class BullmqModule {}
