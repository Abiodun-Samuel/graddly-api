import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { bullmqDefaultJobOptions } from '../bullmq/bullmq-default-job-options.js';
import { QUEUE_WITHDRAWAL_PUSH } from '../bullmq/bullmq.constants.js';

import { WITHDRAWAL_PUSH_JOB_SEND } from './withdrawal-push.constants.js';

import type { IWithdrawalPushJobPayload } from './withdrawal-push.payload.js';

@Injectable()
export class WithdrawalPushDispatchService {
  constructor(
    @InjectQueue(QUEUE_WITHDRAWAL_PUSH)
    private readonly queue: Queue,
  ) {}

  async enqueue(payload: IWithdrawalPushJobPayload): Promise<void> {
    await this.queue.add(WITHDRAWAL_PUSH_JOB_SEND, payload, {
      ...bullmqDefaultJobOptions,
      jobId: payload.pushId,
    });
  }
}
