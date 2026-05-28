import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { Job } from 'bullmq';

import { DAS_JOB_SYNC_ORGANISATION } from '../../das/das-job.constants.js';
import { DasLevySyncService } from '../../das/das-levy-sync.service.js';
import { QUEUE_DAS_SYNC_DLQ } from '../bullmq.constants.js';

import { DasSyncProcessor } from './das-sync.processor.js';

describe('DasSyncProcessor', () => {
  let processor: DasSyncProcessor;
  const syncOrganisation = jest.fn();
  const dlqAdd = jest.fn();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DasSyncProcessor,
        { provide: DasLevySyncService, useValue: { syncOrganisation } },
        {
          provide: getQueueToken(QUEUE_DAS_SYNC_DLQ),
          useValue: { add: dlqAdd },
        },
      ],
    }).compile();

    processor = moduleRef.get(DasSyncProcessor);
    jest.clearAllMocks();
  });

  it('processes organisation sync job', async () => {
    const job = {
      id: 'job-1',
      name: DAS_JOB_SYNC_ORGANISATION,
      data: { organisationId: 'org-1', requestedByUserId: 'user-1' },
    } as Job<{ organisationId: string; requestedByUserId?: string }>;

    await processor.process(job);
    expect(syncOrganisation).toHaveBeenCalledWith('org-1', 'user-1');
  });

  it('publishes terminal failures to DAS DLQ', async () => {
    syncOrganisation.mockRejectedValueOnce(new Error('boom'));
    const job = {
      id: 'job-2',
      name: DAS_JOB_SYNC_ORGANISATION,
      data: { organisationId: 'org-1', requestedByUserId: 'user-1' },
      attemptsMade: 2,
      opts: { attempts: 3 },
    } as unknown as Job<{ organisationId: string; requestedByUserId?: string }>;

    await expect(processor.process(job)).rejects.toThrow('boom');
    expect(dlqAdd).toHaveBeenCalledTimes(1);
  });
});
