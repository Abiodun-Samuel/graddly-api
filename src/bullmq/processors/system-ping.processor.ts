import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { QUEUE_SYSTEM, SYSTEM_JOB_PING } from '../bullmq.constants.js';

@Processor(QUEUE_SYSTEM)
export class SystemPingProcessor extends WorkerHost {
  private readonly logger = new Logger(SystemPingProcessor.name);

  process(job: Job): Promise<void> {
    if (job.name !== SYSTEM_JOB_PING) {
      this.logger.warn(
        `Unknown job name "${job.name}" on ${QUEUE_SYSTEM} queue (job ${job.id})`,
      );
      return Promise.resolve();
    }

    this.logger.log(`Processed ${SYSTEM_JOB_PING} job ${job.id}`);
    return Promise.resolve();
  }
}
