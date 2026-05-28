import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ReviewRecordResponseDto } from './dto/review-record-response.dto.js';
import { UpsertReviewRecordDto } from './dto/upsert-review-record.dto.js';
import { ReviewRecord } from './entities/review-record.entity.js';
import { Review } from './entities/review.entity.js';
import { ReviewStatus } from './enums/review-status.enum.js';

import type { ReviewRecordPayloadDto } from './dto/review-record-payload.dto.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Injectable()
export class ReviewRecordsService {
  constructor(
    @InjectRepository(ReviewRecord)
    private readonly recordRepo: Repository<ReviewRecord>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async upsert(
    user: AuthenticatedUser,
    reviewId: string,
    dto: UpsertReviewRecordDto,
  ): Promise<ReviewRecordResponseDto> {
    const review = await this.findReview(user, reviewId);
    if (review.status === ReviewStatus.COMPLETED) {
      throw new BadRequestException('Cannot update record on completed review');
    }
    if (review.status === ReviewStatus.CANCELLED) {
      throw new BadRequestException('Cannot update record on cancelled review');
    }

    let record = await this.recordRepo.findOne({
      where: { reviewId, organisationId: user.organisationId! },
    });

    if (!record) {
      record = this.recordRepo.create({
        organisationId: user.organisationId!,
        reviewId,
        payload: dto.payload as unknown as Record<string, unknown>,
        submittedAt: new Date(),
        submittedByUserId: user.id,
      });
    } else {
      record.payload = dto.payload as unknown as Record<string, unknown>;
      record.submittedAt = new Date();
      record.submittedByUserId = user.id;
    }

    await this.recordRepo.save(record);

    if (review.status === ReviewStatus.SCHEDULED) {
      review.status = ReviewStatus.IN_PROGRESS;
      await this.reviewRepo.save(review);
    }

    return this.toResponse(record);
  }

  async findOne(
    user: AuthenticatedUser,
    reviewId: string,
  ): Promise<ReviewRecordResponseDto> {
    const record = await this.recordRepo.findOne({
      where: { reviewId, organisationId: user.organisationId! },
    });
    if (!record) {
      throw new NotFoundException('Review record not found');
    }
    return this.toResponse(record);
  }

  async getPayloadForPdf(
    organisationId: string,
    reviewId: string,
  ): Promise<{
    title: string | null;
    scheduledAt: Date;
    apprenticeName: string;
    payload: ReviewRecordPayloadDto | null;
  }> {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, organisationId, isDeleted: false },
      relations: ['apprentice'],
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    const record = await this.recordRepo.findOne({
      where: { reviewId, organisationId },
    });
    const apprentice = review.apprentice;
    return {
      title: review.title,
      scheduledAt: review.scheduledAt,
      apprenticeName: apprentice
        ? `${apprentice.firstName} ${apprentice.lastName}`
        : 'Apprentice',
      payload: (record?.payload as unknown as ReviewRecordPayloadDto) ?? null,
    };
  }

  private async findReview(
    user: AuthenticatedUser,
    reviewId: string,
  ): Promise<Review> {
    const review = await this.reviewRepo.findOne({
      where: {
        id: reviewId,
        organisationId: user.organisationId!,
        isDeleted: false,
      },
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  private toResponse(record: ReviewRecord): ReviewRecordResponseDto {
    return {
      reviewId: record.reviewId,
      payload: record.payload as unknown as ReviewRecordResponseDto['payload'],
      submittedAt: record.submittedAt?.toISOString() ?? null,
      submittedByUserId: record.submittedByUserId,
    };
  }
}
