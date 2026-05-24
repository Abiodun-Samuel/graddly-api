import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { DIGEST_JOB_WEEKLY_OTJ, QUEUE_DIGEST } from '../bullmq.constants.js';

import type { IWeeklyOtjDigestJobPayload } from '../../notifications/digest-job.payload.js';

@Processor(QUEUE_DIGEST)
export class DigestProcessor extends WorkerHost {
  private readonly logger = new Logger(DigestProcessor.name);

  process(job: Job<IWeeklyOtjDigestJobPayload>): Promise<void> {
    switch (job.name) {
      case DIGEST_JOB_WEEKLY_OTJ:
        this.logger.log(
          `Digest skeleton: received ${DIGEST_JOB_WEEKLY_OTJ} for organisation ${job.data.organisationId} (job ${job.id})`,
        );
        return Promise.resolve();
      default:
        this.logger.warn(
          `Unknown job name "${job.name}" on ${QUEUE_DIGEST} queue (job ${job.id})`,
        );
        return Promise.resolve();
    }
  }
}
