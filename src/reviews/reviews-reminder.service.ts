import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';

import { EmailDispatchService } from '../email/email-dispatch.service.js';
import { EmailTemplate } from '../email/email-template.enum.js';
import { SerializedEmailPayload } from '../email/payloads/serialized-email.payload.js';
import { NotificationType } from '../notifications/enums/notification-type.enum.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User } from '../users/entities/user.entity.js';

import { ReviewReminderDispatch } from './entities/review-reminder-dispatch.entity.js';
import { Review } from './entities/review.entity.js';
import { ReviewReminderKind } from './enums/review-reminder-kind.enum.js';
import { ReviewStatus } from './enums/review-status.enum.js';

@Injectable()
export class ReviewsReminderService {
  private readonly logger = new Logger(ReviewsReminderService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewReminderDispatch)
    private readonly dispatchRepo: Repository<ReviewReminderDispatch>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly emailDispatchService: EmailDispatchService,
    private readonly config: ConfigService,
  ) {}

  async sendDueReminders(): Promise<number> {
    let sent = 0;
    sent += await this.sendForKind(ReviewReminderKind.SEVEN_DAYS, 7);
    sent += await this.sendForKind(ReviewReminderKind.ONE_DAY, 1);
    return sent;
  }

  private async sendForKind(
    kind: ReviewReminderKind,
    daysAhead: number,
  ): Promise<number> {
    const targetDay = this.utcDateOnly(new Date());
    targetDay.setUTCDate(targetDay.getUTCDate() + daysAhead);
    const dayStart = new Date(targetDay);
    const dayEnd = new Date(targetDay);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const reviews = await this.reviewRepo.find({
      where: {
        status: ReviewStatus.SCHEDULED,
        isDeleted: false,
        scheduledAt: Between(dayStart, dayEnd),
      },
    });

    let sent = 0;
    for (const review of reviews) {
      const existing = await this.dispatchRepo.findOne({
        where: { reviewId: review.id, reminderKind: kind },
      });
      if (existing) continue;

      try {
        await this.notifySigners(review, kind, daysAhead);
        await this.dispatchRepo.save(
          this.dispatchRepo.create({
            reviewId: review.id,
            reminderKind: kind,
            sentAt: new Date(),
          }),
        );
        sent++;
      } catch (error) {
        this.logger.warn(
          `Failed review reminder ${kind} for ${review.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return sent;
  }

  private async notifySigners(
    review: Review,
    kind: ReviewReminderKind,
    daysAhead: number,
  ): Promise<void> {
    const userIds = [
      review.tutorUserId,
      review.apprenticeUserId,
      review.employerManagerUserId,
    ];
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const scheduledLabel = review.scheduledAt.toISOString().slice(0, 10);
    const title = review.title ?? `Review on ${scheduledLabel}`;

    for (const signerId of userIds) {
      const signer = users.find((u) => u.id === signerId);
      if (!signer) continue;

      await this.notificationsService.createForUser({
        userId: signer.id,
        organisationId: review.organisationId,
        type: NotificationType.REVIEW,
        title: `Review reminder (${kind})`,
        body: `${title} is scheduled in ${daysAhead} day(s).`,
        metadata: { reviewId: review.id, reminderKind: kind },
      });

      if (signer.email) {
        await this.emailDispatchService.enqueue(
          new SerializedEmailPayload(
            EmailTemplate.REVIEW_REMINDER,
            signer.email,
            {
              firstName: signer.firstName,
              reviewTitle: title,
              scheduledAt: scheduledLabel,
              daysAhead,
              appName: this.config.get<string>('app.email.appName', 'Graddly'),
            },
          ),
        );
      }
    }
  }

  private utcDateOnly(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }
}
