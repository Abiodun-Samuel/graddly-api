import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';

import { bullmqDefaultJobOptions } from '../bullmq/bullmq-default-job-options.js';
import { QUEUE_EMAIL } from '../bullmq/bullmq.constants.js';

import { EmailDispatchService } from './email-dispatch.service.js';
import { EMAIL_JOB_SEND } from './email-job.constants.js';
import { EmailPayloadFactory } from './email-payload.factory.js';
import { EmailTemplate } from './email-template.enum.js';
import { EmailService } from './email.service.js';
import { SerializedEmailPayload } from './payloads/serialized-email.payload.js';

describe('EmailDispatchService', () => {
  let service: EmailDispatchService;
  const queueAdd = jest.fn();
  const emailService = { sendEmail: jest.fn() };

  beforeEach(async () => {
    queueAdd.mockResolvedValue(undefined);
    emailService.sendEmail.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailDispatchService,
        EmailPayloadFactory,
        { provide: getQueueToken(QUEUE_EMAIL), useValue: { add: queueAdd } },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(EmailDispatchService);
  });

  it('enqueues serialized email jobs', async () => {
    const payload = new SerializedEmailPayload(
      EmailTemplate.PASSWORD_RESET,
      'user@example.com',
      { firstName: 'Ada' },
    );

    await service.enqueue(payload);

    expect(queueAdd).toHaveBeenCalledWith(
      EMAIL_JOB_SEND,
      {
        template: EmailTemplate.PASSWORD_RESET,
        to: 'user@example.com',
        context: { firstName: 'Ada' },
      },
      bullmqDefaultJobOptions,
    );
  });

  it('sendNow delegates to EmailService', async () => {
    const payload = new SerializedEmailPayload(
      EmailTemplate.EMAIL_VERIFICATION,
      'user@example.com',
      { firstName: 'Ada' },
    );

    await service.sendNow(payload);

    expect(emailService.sendEmail).toHaveBeenCalledWith(payload);
  });
});
