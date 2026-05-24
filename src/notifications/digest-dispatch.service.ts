import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { bullmqDefaultJobOptions } from '../bullmq/bullmq-default-job-options.js';
import {
  DIGEST_JOB_WEEKLY_OTJ,
  QUEUE_DIGEST,
} from '../bullmq/bullmq.constants.js';

import type { IWeeklyOtjDigestJobPayload } from './digest-job.payload.js';

@Injectable()
export class DigestDispatchService {
  constructor(@InjectQueue(QUEUE_DIGEST) private readonly digestQueue: Queue) {}

  async enqueueWeeklyOtjDigest(
    payload: IWeeklyOtjDigestJobPayload,
  ): Promise<void> {
    await this.digestQueue.add(
      DIGEST_JOB_WEEKLY_OTJ,
      payload,
      bullmqDefaultJobOptions,
    );
  }
}
