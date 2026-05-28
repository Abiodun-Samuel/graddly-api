import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PdfJobResponseDto } from '../pdf/dto/pdf-job-response.dto.js';
import { PdfJobTemplate } from '../pdf/enums/pdf-job-template.enum.js';
import { PdfDispatchService } from '../pdf/pdf-dispatch.service.js';
import { PdfJobsService } from '../pdf/pdf-jobs.service.js';

import { Review } from './entities/review.entity.js';
import { ReviewStatus } from './enums/review-status.enum.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Injectable()
export class ReviewsSnapshotService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly pdfDispatch: PdfDispatchService,
    private readonly pdfJobsService: PdfJobsService,
  ) {}

  async requestSnapshot(
    user: AuthenticatedUser,
    reviewId: string,
  ): Promise<PdfJobResponseDto> {
    const review = await this.reviewRepo.findOne({
      where: {
        id: reviewId,
        organisationId: user.organisationId!,
        isDeleted: false,
      },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (
      review.status === ReviewStatus.COMPLETED ||
      review.status === ReviewStatus.CANCELLED
    ) {
      throw new ConflictException('Cannot snapshot a terminal review');
    }

    if (review.snapshotPdfJobId) {
      return this.pdfJobsService.findOne(user, review.snapshotPdfJobId);
    }

    const job = await this.pdfDispatch.enqueue({
      organisationId: user.organisationId!,
      userId: user.id,
      template: PdfJobTemplate.REVIEW_SNAPSHOT,
      reviewId: review.id,
    });

    review.snapshotPdfJobId = job.id;
    await this.reviewRepo.save(review);

    return {
      jobId: job.id,
      status: job.status,
      template: job.template,
      outputKey: job.outputKey,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
    };
  }
}
