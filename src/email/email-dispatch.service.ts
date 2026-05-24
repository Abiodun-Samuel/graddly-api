import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { bullmqDefaultJobOptions } from '../bullmq/bullmq-default-job-options.js';
import { QUEUE_EMAIL } from '../bullmq/bullmq.constants.js';

import { EMAIL_JOB_SEND } from './email-job.constants.js';
import { EmailPayloadFactory } from './email-payload.factory.js';
import { EmailService } from './email.service.js';

import type { BaseEmailPayload } from './payloads/base-email.payload.js';

@Injectable()
export class EmailDispatchService {
  constructor(
    @InjectQueue(QUEUE_EMAIL) private readonly emailQueue: Queue,
    private readonly emailPayloadFactory: EmailPayloadFactory,
    private readonly emailService: EmailService,
  ) {}

  async enqueue(payload: BaseEmailPayload): Promise<void> {
    const data = this.emailPayloadFactory.toJob(payload);
    await this.emailQueue.add(EMAIL_JOB_SEND, data, bullmqDefaultJobOptions);
  }

  async sendNow(payload: BaseEmailPayload): Promise<void> {
    await this.emailService.sendEmail(payload);
  }
}
