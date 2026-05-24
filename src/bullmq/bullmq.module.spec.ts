import { getQueueToken } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import appConfig from '../config/app.config.js';
import { validateEnv } from '../config/validate-env.js';

import { QUEUE_EMAIL, QUEUE_SYSTEM } from './bullmq.constants.js';
import { BullmqModule } from './bullmq.module.js';

describe('BullmqModule', () => {
  it('registers configured queues for injection', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: validateEnv,
          load: [appConfig],
        }),
        BullmqModule,
      ],
    }).compile();

    expect(moduleRef.get(getQueueToken(QUEUE_EMAIL))).toBeDefined();
    expect(moduleRef.get(getQueueToken(QUEUE_SYSTEM))).toBeDefined();

    await moduleRef.close();
  });
});
