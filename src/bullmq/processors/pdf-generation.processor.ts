import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';

import {
  setCurrentOrganisationId,
  setCurrentUserId,
} from '../../common/context/correlation-id-context.js';
import { setLastKnownUserIdForGuc } from '../../database/apply-tenant-gucs.js';
import { PdfGenerationJob } from '../../pdf/entities/pdf-generation-job.entity.js';
import { PdfJobStatus } from '../../pdf/enums/pdf-job-status.enum.js';
import { PDF_JOB_GENERATE } from '../../pdf/pdf-job.constants.js';
import { PdfService } from '../../pdf/pdf.service.js';
import { StorageObjectCategory } from '../../storage/enums/storage-object-category.enum.js';
import { StorageKeyBuilder } from '../../storage/storage-key.builder.js';
import { StorageService } from '../../storage/storage.service.js';
import { QUEUE_PDF } from '../bullmq.constants.js';

import type { IPdfJobPayload } from '../../pdf/pdf-job.payload.js';

@Processor(QUEUE_PDF)
export class PdfGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfGenerationProcessor.name);

  constructor(
    private readonly pdfService: PdfService,
    private readonly storage: StorageService,
    private readonly keyBuilder: StorageKeyBuilder,
    @InjectRepository(PdfGenerationJob)
    private readonly jobRepo: Repository<PdfGenerationJob>,
  ) {
    super();
  }

  async process(job: Job<IPdfJobPayload>): Promise<void> {
    if (job.name !== PDF_JOB_GENERATE) {
      this.logger.warn(
        `Unknown job name "${job.name}" on ${QUEUE_PDF} queue (job ${job.id})`,
      );
      return;
    }

    const { jobId, organisationId, userId } = job.data;
    setCurrentUserId(userId);
    setCurrentOrganisationId(organisationId);
    setLastKnownUserIdForGuc(userId);

    await this.jobRepo.update(jobId, { status: PdfJobStatus.PROCESSING });

    try {
      const buffer = await this.pdfService.renderHelloPdf();
      const outputKey = this.keyBuilder.build({
        organisationId,
        category: StorageObjectCategory.EXPORT,
        filename: `hello-${jobId}.pdf`,
        objectId: jobId,
      });

      await this.storage.putObject(
        organisationId,
        outputKey,
        buffer,
        'application/pdf',
      );

      await this.jobRepo.update(jobId, {
        status: PdfJobStatus.COMPLETED,
        outputKey,
        completedAt: new Date(),
        errorMessage: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'PDF generation failed';
      await this.jobRepo.update(jobId, {
        status: PdfJobStatus.FAILED,
        errorMessage: message,
      });
      throw error;
    }
  }
}
