import { Logger } from '@nestjs/common';

import { IWeeklyOtjDigestJobPayload } from '../../notifications/digest-job.payload.js';
import { DIGEST_JOB_WEEKLY_OTJ } from '../bullmq.constants.js';

import { DigestProcessor } from './digest.processor.js';

import type { Job } from 'bullmq';

describe('DigestProcessor', () => {
  let processor: DigestProcessor;
  let logSpy: jest.SpiedFunction<Logger['log']>;

  beforeEach(() => {
    processor = new DigestProcessor();
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('logs weekly OTJ digest skeleton jobs', async () => {
    const job = {
      id: '1',
      name: DIGEST_JOB_WEEKLY_OTJ,
      data: { organisationId: 'org-1' },
    } as Job<IWeeklyOtjDigestJobPayload>;

    await processor.process(job);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('weekly-otj-digest'),
    );
  });
});
