import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { QUEUE_PDF } from '../bullmq/bullmq.constants.js';

import { PdfGenerationJob } from './entities/pdf-generation-job.entity.js';
import { PdfJobStatus } from './enums/pdf-job-status.enum.js';
import { PdfJobTemplate } from './enums/pdf-job-template.enum.js';
import { PdfDispatchService } from './pdf-dispatch.service.js';
import { PDF_JOB_GENERATE } from './pdf-job.constants.js';

describe('PdfDispatchService', () => {
  let service: PdfDispatchService;
  const add = jest.fn();
  const save = jest.fn();
  const create = jest.fn();

  beforeEach(async () => {
    add.mockReset();
    save.mockReset();
    create.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PdfDispatchService,
        {
          provide: getQueueToken(QUEUE_PDF),
          useValue: { add },
        },
        {
          provide: getRepositoryToken(PdfGenerationJob),
          useValue: {
            create,
            save,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(PdfDispatchService);
  });

  it('creates a queued job and enqueues BullMQ work', async () => {
    create.mockImplementation((value: PdfGenerationJob) => value);
    save.mockImplementation((value: PdfGenerationJob) =>
      Promise.resolve(value),
    );

    const result = await service.enqueue({
      organisationId: 'org-1',
      userId: 'user-1',
      template: PdfJobTemplate.HELLO,
    });

    expect(result.status).toBe(PdfJobStatus.QUEUED);
    expect(result.id).toEqual(expect.any(String));
    expect(add).toHaveBeenCalledWith(
      PDF_JOB_GENERATE,
      expect.objectContaining({
        jobId: result.id,
        organisationId: 'org-1',
        userId: 'user-1',
        template: PdfJobTemplate.HELLO,
      }),
      expect.objectContaining({ jobId: result.id }),
    );
  });
});
