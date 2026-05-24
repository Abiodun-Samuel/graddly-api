import { FailedJobSummaryDto } from './dto/failed-job-summary.dto.js';
import { QueueJobCountsDto } from './dto/queue-job-counts.dto.js';
import { QueueJobDetailDto } from './dto/queue-job-detail.dto.js';

import type { Job } from 'bullmq';

export function toQueueJobCountsDto(
  counts: Record<string, number>,
): QueueJobCountsDto {
  return {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
    prioritized: counts.prioritized ?? 0,
    waitingChildren: counts['waiting-children'] ?? 0,
  };
}

export function toFailedJobSummaryDto(job: Job): FailedJobSummaryDto {
  return {
    id: String(job.id),
    name: job.name,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason || undefined,
    timestamp: job.timestamp,
    finishedOn: job.finishedOn,
  };
}

export function toQueueJobDetailDto(job: Job): QueueJobDetailDto {
  return {
    ...toFailedJobSummaryDto(job),
    data: job.data,
    stacktrace: job.stacktrace,
    opts: job.opts as Record<string, unknown>,
  };
}
