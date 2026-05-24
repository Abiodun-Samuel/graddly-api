import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { EMAIL_JOB_SEND } from '../../email/email-job.constants.js';
import { EmailPayloadFactory } from '../../email/email-payload.factory.js';
import { EmailService } from '../../email/email.service.js';
import { QUEUE_EMAIL } from '../bullmq.constants.js';

import type { IEmailJobPayload } from '../../email/email-job.payload.js';

@Processor(QUEUE_EMAIL)
export class EmailSendProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailSendProcessor.name);

  constructor(
    private readonly emailPayloadFactory: EmailPayloadFactory,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<IEmailJobPayload>): Promise<void> {
    if (job.name !== EMAIL_JOB_SEND) {
      this.logger.warn(
        `Unknown job name "${job.name}" on ${QUEUE_EMAIL} queue (job ${job.id})`,
      );
      return;
    }

    const payload = this.emailPayloadFactory.fromJob(job.data);
    await this.emailService.sendEmail(payload);
  }
}
