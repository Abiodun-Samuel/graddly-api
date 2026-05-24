import {
  toFailedJobSummaryDto,
  toQueueJobCountsDto,
} from './bullmq-job.mapper.js';

import type { Job } from 'bullmq';

describe('bullmq-job.mapper', () => {
  it('maps queue job counts', () => {
    const counts: Record<string, number> = { waiting: 1, failed: 2 };
    counts['waiting-children'] = 3;

    expect(toQueueJobCountsDto(counts)).toEqual({
      waiting: 1,
      active: 0,
      completed: 0,
      failed: 2,
      delayed: 0,
      prioritized: 0,
      waitingChildren: 3,
    });
  });

  it('maps failed job summaries without payload', () => {
    const summary = toFailedJobSummaryDto({
      id: '7',
      name: 'ping',
      attemptsMade: 3,
      failedReason: 'boom',
      timestamp: 100,
      finishedOn: 200,
    } as Job);

    expect(summary).toEqual({
      id: '7',
      name: 'ping',
      attemptsMade: 3,
      failedReason: 'boom',
      timestamp: 100,
      finishedOn: 200,
    });
    expect(summary).not.toHaveProperty('data');
  });
});
