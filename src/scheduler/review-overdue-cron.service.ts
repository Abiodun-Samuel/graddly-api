import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { ReviewsOverdueService } from '../reviews/reviews-overdue.service.js';

import { CronLockService } from './cron-lock.service.js';
import { REVIEW_OVERDUE_CRON_NAME } from './scheduler.constants.js';

@Injectable()
export class ReviewOverdueCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReviewOverdueCronService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cronLock: CronLockService,
    private readonly overdueService: ReviewsOverdueService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('app.cron.enabled', true)) return;
    if (!this.config.get<boolean>('app.cron.reviewOverdueEnabled', false))
      return;

    const expression = this.config.get<string>(
      'app.cron.reviewOverdueSchedule',
      '0 2 * * *',
    );
    const job = new CronJob(expression, () => {
      void this.handleReviewOverdueCron();
    });
    this.schedulerRegistry.addCronJob(REVIEW_OVERDUE_CRON_NAME, job);
    job.start();
    this.logger.log(
      `Registered "${REVIEW_OVERDUE_CRON_NAME}" cron (${expression})`,
    );
  }

  onModuleDestroy(): void {
    if (!this.schedulerRegistry.doesExist('cron', REVIEW_OVERDUE_CRON_NAME))
      return;
    const job = this.schedulerRegistry.getCronJob(REVIEW_OVERDUE_CRON_NAME);
    void job.stop();
    this.schedulerRegistry.deleteCronJob(REVIEW_OVERDUE_CRON_NAME);
  }

  async handleReviewOverdueCron(): Promise<void> {
    await this.cronLock.runExclusive(REVIEW_OVERDUE_CRON_NAME, async () => {
      const updated = await this.overdueService.flagOverdueReviews();
      this.logger.log(`Review overdue cron flagged ${updated} reviews`);
    });
  }
}
