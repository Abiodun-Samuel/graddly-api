import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from 'bullmq';

import { PdfGenerationProcessor } from '../../bullmq/processors/pdf-generation.processor.js';
import { PdfGenerationJob } from '../../pdf/entities/pdf-generation-job.entity.js';
import { PdfJobStatus } from '../../pdf/enums/pdf-job-status.enum.js';
import { PdfJobTemplate } from '../../pdf/enums/pdf-job-template.enum.js';
import { PDF_JOB_GENERATE } from '../../pdf/pdf-job.constants.js';
import { PdfService } from '../../pdf/pdf.service.js';
import { StorageKeyBuilder } from '../../storage/storage-key.builder.js';
import { StorageService } from '../../storage/storage.service.js';

import type { IPdfJobPayload } from '../../pdf/pdf-job.payload.js';

describe('PdfGenerationProcessor', () => {
  let processor: PdfGenerationProcessor;
  const update = jest.fn();
  const putObject = jest.fn();

  beforeEach(async () => {
    update.mockReset();
    putObject.mockReset();
    putObject.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PdfGenerationProcessor,
        {
          provide: PdfService,
          useValue: {
            renderHelloPdf: jest
              .fn()
              .mockResolvedValue(Buffer.from('%PDF-test')),
          },
        },
        {
          provide: StorageService,
          useValue: { putObject },
        },
        {
          provide: StorageKeyBuilder,
          useValue: {
            build: jest
              .fn()
              .mockReturnValue('orgs/org-1/export/job-1/hello-job-1.pdf'),
          },
        },
        {
          provide: getRepositoryToken(PdfGenerationJob),
          useValue: { update },
        },
      ],
    }).compile();

    processor = moduleRef.get(PdfGenerationProcessor);
  });

  it('generates PDF and marks job completed', async () => {
    const job = {
      id: 'job-1',
      name: PDF_JOB_GENERATE,
      data: {
        jobId: 'job-1',
        organisationId: 'org-1',
        userId: 'user-1',
        template: PdfJobTemplate.HELLO,
      },
    } as Job<IPdfJobPayload>;

    await processor.process(job);

    expect(update).toHaveBeenCalledWith('job-1', {
      status: PdfJobStatus.PROCESSING,
    });
    expect(putObject).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({ status: PdfJobStatus.COMPLETED }),
    );
  });
});
