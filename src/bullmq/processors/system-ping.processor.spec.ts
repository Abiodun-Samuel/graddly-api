import { Test } from '@nestjs/testing';
import { Job } from 'bullmq';

import { SYSTEM_JOB_PING } from '../bullmq.constants.js';

import { SystemPingProcessor } from './system-ping.processor.js';

describe('SystemPingProcessor', () => {
  let processor: SystemPingProcessor;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [SystemPingProcessor],
    }).compile();

    processor = moduleRef.get(SystemPingProcessor);
  });

  it('processes ping jobs without error', async () => {
    const job = {
      id: '1',
      name: SYSTEM_JOB_PING,
    } as Job;

    await expect(processor.process(job)).resolves.toBeUndefined();
  });

  it('ignores unknown job names', async () => {
    const job = {
      id: '2',
      name: 'unknown',
    } as Job;

    await expect(processor.process(job)).resolves.toBeUndefined();
  });
});
