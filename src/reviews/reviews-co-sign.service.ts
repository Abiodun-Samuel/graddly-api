import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateSignatureRecordDto } from '../esignature/dto/create-signature-record.dto.js';
import { EsignatureService } from '../esignature/esignature.service.js';
import { NotificationType } from '../notifications/enums/notification-type.enum.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { OrganisationRole } from '../organisations/organisation-role.enum.js';
import { PdfGenerationJob } from '../pdf/entities/pdf-generation-job.entity.js';
import { PdfJobStatus } from '../pdf/enums/pdf-job-status.enum.js';

import { SignReviewResponseDto } from './dto/sign-review-response.dto.js';
import { SignReviewDto } from './dto/sign-review.dto.js';
import { ReviewSignature } from './entities/review-signature.entity.js';
import { Review } from './entities/review.entity.js';
import { ReviewSignatureStatus } from './enums/review-signature-status.enum.js';
import { ReviewSignerParty } from './enums/review-signer-party.enum.js';
import { ReviewStatus } from './enums/review-status.enum.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

const PARTY_ORDER: ReviewSignerParty[] = [
  ReviewSignerParty.APPRENTICE,
  ReviewSignerParty.TUTOR,
  ReviewSignerParty.EMPLOYER_MANAGER,
];

@Injectable()
export class ReviewsCoSignService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewSignature)
    private readonly signatureRepo: Repository<ReviewSignature>,
    @InjectRepository(PdfGenerationJob)
    private readonly pdfJobRepo: Repository<PdfGenerationJob>,
    private readonly esignatureService: EsignatureService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sign(
    user: AuthenticatedUser,
    reviewId: string,
    dto: SignReviewDto,
    clientIp: string,
    userAgent?: string,
  ): Promise<SignReviewResponseDto> {
    const organisationId = user.organisationId!;
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId, organisationId, isDeleted: false },
    });
    if (!review) throw new NotFoundException('Review not found');

    if (
      review.status === ReviewStatus.COMPLETED ||
      review.status === ReviewStatus.CANCELLED
    ) {
      throw new ConflictException('Review is not open for signing');
    }

    await this.initializeForSigning(review);
    const refreshed = await this.reviewRepo.findOne({
      where: { id: reviewId, organisationId },
    });
    if (!refreshed || refreshed.status !== ReviewStatus.AWAITING_SIGNATURES) {
      throw new ConflictException(
        'Review is not ready for signing; ensure snapshot PDF is complete',
      );
    }
    review.status = refreshed.status;

    const signatures = await this.signatureRepo.find({
      where: { reviewId, organisationId },
      order: { signOrder: 'ASC' },
    });

    const next = signatures.find(
      (s) => s.status === ReviewSignatureStatus.PENDING,
    );
    if (!next) {
      throw new ConflictException('All parties have already signed');
    }
    if (next.party !== dto.party) {
      throw new ConflictException(
        `Next signer is ${next.party}, not ${dto.party}`,
      );
    }
    if (next.signerUserId !== user.id && !this.isAdmin(user)) {
      throw new ForbiddenException(
        'You are not the assigned signer for this party',
      );
    }

    const createDto: CreateSignatureRecordDto = {
      signatureImageKey: dto.signatureImageKey,
    };

    if (next.signOrder === 1) {
      if (!review.snapshotPdfJobId) {
        throw new ConflictException(
          'Review snapshot PDF has not been requested',
        );
      }
      const pdfJob = await this.pdfJobRepo.findOne({
        where: { id: review.snapshotPdfJobId, organisationId },
      });
      if (
        !pdfJob ||
        pdfJob.status !== PdfJobStatus.COMPLETED ||
        !pdfJob.outputKey
      ) {
        throw new ConflictException('Review snapshot PDF is not ready');
      }
      createDto.pdfJobId = pdfJob.id;
    } else {
      const previous = signatures.find(
        (s) => s.signOrder === next.signOrder - 1,
      );
      if (!previous?.signatureRecordId) {
        throw new ConflictException('Previous party has not signed');
      }
      const prevRecord = await this.esignatureService.findOne(
        user,
        previous.signatureRecordId,
      );
      if (!prevRecord.signedPdfKey) {
        throw new ConflictException('Previous signed PDF is not available');
      }
      createDto.sourcePdfKey = prevRecord.signedPdfKey;
    }

    const record = await this.esignatureService.createRecord(
      user,
      createDto,
      clientIp,
      userAgent,
    );
    const signed = await this.esignatureService.completeSigning(
      user,
      record.id,
    );

    next.status = ReviewSignatureStatus.SIGNED;
    next.signatureRecordId = record.id;
    await this.signatureRepo.save(next);

    const remaining = signatures.filter(
      (s) => s.id !== next.id && s.status === ReviewSignatureStatus.PENDING,
    );

    if (remaining.length === 0) {
      review.status = ReviewStatus.COMPLETED;
      review.finalSignedPdfKey = signed.signedPdfKey;
      await this.reviewRepo.save(review);
      await this.notifyCompletion(review);
    } else if (review.status !== ReviewStatus.AWAITING_SIGNATURES) {
      review.status = ReviewStatus.AWAITING_SIGNATURES;
      await this.reviewRepo.save(review);
    }

    const nextPending = remaining.sort((a, b) => a.signOrder - b.signOrder)[0];

    return {
      reviewId: review.id,
      party: next.party,
      reviewStatus: review.status,
      signedPdfKey: signed.signedPdfKey,
      downloadUrl: signed.downloadUrl,
      downloadExpiresAt: signed.downloadExpiresAt,
      nextParty: nextPending?.party ?? null,
    };
  }

  async initializeForSigning(review: Review): Promise<void> {
    if (!review.snapshotPdfJobId) return;
    const pdfJob = await this.pdfJobRepo.findOne({
      where: {
        id: review.snapshotPdfJobId,
        organisationId: review.organisationId,
      },
    });
    if (pdfJob?.status === PdfJobStatus.COMPLETED && pdfJob.outputKey) {
      await this.ensureSignatureSlots(review);
      if (
        review.status === ReviewStatus.IN_PROGRESS ||
        review.status === ReviewStatus.SCHEDULED
      ) {
        review.status = ReviewStatus.AWAITING_SIGNATURES;
        await this.reviewRepo.save(review);
      }
    }
  }

  private async ensureSignatureSlots(review: Review): Promise<void> {
    const existing = await this.signatureRepo.count({
      where: { reviewId: review.id },
    });
    if (existing > 0) return;

    const slots = PARTY_ORDER.map((party, index) =>
      this.signatureRepo.create({
        organisationId: review.organisationId,
        reviewId: review.id,
        party,
        signOrder: index + 1,
        signerUserId: this.signerIdForParty(review, party),
        status: ReviewSignatureStatus.PENDING,
      }),
    );
    await this.signatureRepo.save(slots);
  }

  private signerIdForParty(review: Review, party: ReviewSignerParty): string {
    switch (party) {
      case ReviewSignerParty.APPRENTICE:
        return review.apprenticeUserId;
      case ReviewSignerParty.TUTOR:
        return review.tutorUserId;
      case ReviewSignerParty.EMPLOYER_MANAGER:
        return review.employerManagerUserId;
    }
  }

  private isAdmin(user: AuthenticatedUser): boolean {
    const roles = user.roles ?? [];
    return (
      roles.includes(OrganisationRole.OWNER) ||
      roles.includes(OrganisationRole.ADMIN)
    );
  }

  private async notifyCompletion(review: Review): Promise<void> {
    const userIds = [
      review.apprenticeUserId,
      review.tutorUserId,
      review.employerManagerUserId,
    ];
    for (const userId of userIds) {
      await this.notificationsService.createForUser({
        userId,
        organisationId: review.organisationId,
        type: NotificationType.REVIEW,
        title: 'Review completed',
        body: `Review ${review.id} has been fully signed.`,
        metadata: { reviewId: review.id, status: ReviewStatus.COMPLETED },
      });
    }
  }
}
