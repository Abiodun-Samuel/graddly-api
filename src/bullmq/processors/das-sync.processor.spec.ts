import { Test } from '@nestjs/testing';
import { Job } from 'bullmq';

import { DAS_JOB_SYNC_ORGANISATION } from '../../das/das-job.constants.js';
import { DasLevySyncService } from '../../das/das-levy-sync.service.js';

import { DasSyncProcessor } from './das-sync.processor.js';

describe('DasSyncProcessor', () => {
  let processor: DasSyncProcessor;
  const syncOrganisation = jest.fn();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DasSyncProcessor,
        { provide: DasLevySyncService, useValue: { syncOrganisation } },
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
});
