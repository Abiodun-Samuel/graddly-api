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
import { PdfJobTemplate } from '../../pdf/enums/pdf-job-template.enum.js';
import { PDF_JOB_GENERATE } from '../../pdf/pdf-job.constants.js';
import { PdfService } from '../../pdf/pdf.service.js';
import { ReviewRecord } from '../../reviews/entities/review-record.entity.js';
import { ReviewSignature } from '../../reviews/entities/review-signature.entity.js';
import { Review } from '../../reviews/entities/review.entity.js';
import { ReviewSignatureStatus } from '../../reviews/enums/review-signature-status.enum.js';
import { ReviewSignerParty } from '../../reviews/enums/review-signer-party.enum.js';
import { ReviewStatus } from '../../reviews/enums/review-status.enum.js';
import { StorageObjectCategory } from '../../storage/enums/storage-object-category.enum.js';
import { StorageKeyBuilder } from '../../storage/storage-key.builder.js';
import { StorageService } from '../../storage/storage.service.js';
import { QUEUE_PDF } from '../bullmq.constants.js';

import type { IReviewSnapshotContent } from '../../pdf/interfaces/pdf-renderer.interface.js';
import type { IPdfJobPayload } from '../../pdf/pdf-job.payload.js';
import type { ReviewRecordPayloadDto } from '../../reviews/dto/review-record-payload.dto.js';

@Processor(QUEUE_PDF)
export class PdfGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfGenerationProcessor.name);

  constructor(
    private readonly pdfService: PdfService,
    private readonly storage: StorageService,
    private readonly keyBuilder: StorageKeyBuilder,
    @InjectRepository(PdfGenerationJob)
    private readonly jobRepo: Repository<PdfGenerationJob>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewRecord)
    private readonly reviewRecordRepo: Repository<ReviewRecord>,
    @InjectRepository(ReviewSignature)
    private readonly reviewSignatureRepo: Repository<ReviewSignature>,
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

    const { jobId, organisationId, userId, template, reviewId } = job.data;
    setCurrentUserId(userId);
    setCurrentOrganisationId(organisationId);
    setLastKnownUserIdForGuc(userId);

    await this.jobRepo.update(jobId, { status: PdfJobStatus.PROCESSING });

    try {
      let buffer: Buffer;
      let filename: string;

      if (template === PdfJobTemplate.REVIEW_SNAPSHOT) {
        if (!reviewId) {
          throw new Error('reviewId is required for review_snapshot template');
        }
        const content = await this.buildReviewSnapshotContent(
          organisationId,
          reviewId,
        );
        buffer = await this.pdfService.renderReviewSnapshot(content);
        filename = `review-snapshot-${reviewId}.pdf`;
      } else {
        buffer = await this.pdfService.renderHelloPdf();
        filename = `hello-${jobId}.pdf`;
      }

      const outputKey = this.keyBuilder.build({
        organisationId,
        category: StorageObjectCategory.EXPORT,
        filename,
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

      if (template === PdfJobTemplate.REVIEW_SNAPSHOT && reviewId) {
        await this.prepareReviewSigning(organisationId, reviewId);
      }
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

  private async buildReviewSnapshotContent(
    organisationId: string,
    reviewId: string,
  ): Promise<IReviewSnapshotContent> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, organisationId, isDeleted: false },
      relations: ['apprentice'],
    });
    if (!review) {
      throw new Error('Review not found for snapshot');
    }
    const record = await this.reviewRecordRepo.findOne({
      where: { reviewId, organisationId },
    });
    const payload = record?.payload as ReviewRecordPayloadDto | undefined;
    return {
      title: review.title,
      scheduledAt: review.scheduledAt.toISOString().slice(0, 10),
      apprenticeName: review.apprentice
        ? `${review.apprentice.firstName} ${review.apprentice.lastName}`
        : 'Apprentice',
      progressSummary: payload?.progressSummary,
      actionsAgreed: payload?.actionsAgreed,
      employerComments: payload?.employerComments,
      smartGoals: payload?.smartGoals,
      wellbeingScore: payload?.wellbeing?.score,
      wellbeingNotes: payload?.wellbeing?.notes,
    };
  }

  private async prepareReviewSigning(
    organisationId: string,
    reviewId: string,
  ): Promise<void> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, organisationId, isDeleted: false },
    });
    if (!review) return;

    const existing = await this.reviewSignatureRepo.count({
      where: { reviewId },
    });
    if (existing === 0) {
      const parties = [
        {
          party: ReviewSignerParty.APPRENTICE,
          signerUserId: review.apprenticeUserId,
        },
        {
          party: ReviewSignerParty.TUTOR,
          signerUserId: review.tutorUserId,
        },
        {
          party: ReviewSignerParty.EMPLOYER_MANAGER,
          signerUserId: review.employerManagerUserId,
        },
      ];
      await this.reviewSignatureRepo.save(
        parties.map((p, index) =>
          this.reviewSignatureRepo.create({
            organisationId,
            reviewId,
            party: p.party,
            signOrder: index + 1,
            signerUserId: p.signerUserId,
            status: ReviewSignatureStatus.PENDING,
          }),
        ),
      );
    }

    if (
      review.status === ReviewStatus.SCHEDULED ||
      review.status === ReviewStatus.IN_PROGRESS
    ) {
      review.status = ReviewStatus.AWAITING_SIGNATURES;
      await this.reviewRepo.save(review);
    }
  }
}
