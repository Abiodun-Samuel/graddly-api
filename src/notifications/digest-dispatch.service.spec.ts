import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';

import { bullmqDefaultJobOptions } from '../bullmq/bullmq-default-job-options.js';
import {
  DIGEST_JOB_WEEKLY_OTJ,
  QUEUE_DIGEST,
} from '../bullmq/bullmq.constants.js';

import { DigestDispatchService } from './digest-dispatch.service.js';

describe('DigestDispatchService', () => {
  let service: DigestDispatchService;
  const queueAdd = jest.fn();

  beforeEach(async () => {
    queueAdd.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigestDispatchService,
        { provide: getQueueToken(QUEUE_DIGEST), useValue: { add: queueAdd } },
      ],
    }).compile();

    service = module.get(DigestDispatchService);
  });

  it('enqueues weekly OTJ digest jobs', async () => {
    await service.enqueueWeeklyOtjDigest({ organisationId: 'org-1' });

    expect(queueAdd).toHaveBeenCalledWith(
      DIGEST_JOB_WEEKLY_OTJ,
      { organisationId: 'org-1' },
      bullmqDefaultJobOptions,
    );
  });
});
