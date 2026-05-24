import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { CronJob } from 'cron';

import { RedisHealthIndicator } from '../health/redis-health.indicator.js';

import { CronLockService } from './cron-lock.service.js';
import { HEALTH_CHECK_CRON_NAME } from './scheduler.constants.js';

@Injectable()
export class HealthCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthCronService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cronLock: CronLockService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('app.cron.enabled', true)) {
      return;
    }

    const expression = this.config.get<string>(
      'app.cron.healthSchedule',
      '*/5 * * * *',
    );

    const job = new CronJob(expression, () => {
      void this.handleHealthCheckCron();
    });

    this.schedulerRegistry.addCronJob(HEALTH_CHECK_CRON_NAME, job);
    job.start();

    this.logger.log(
      `Registered "${HEALTH_CHECK_CRON_NAME}" cron (${expression})`,
    );
  }

  onModuleDestroy(): void {
    if (!this.schedulerRegistry.doesExist('cron', HEALTH_CHECK_CRON_NAME)) {
      return;
    }

    const job = this.schedulerRegistry.getCronJob(HEALTH_CHECK_CRON_NAME);
    void job.stop();
    this.schedulerRegistry.deleteCronJob(HEALTH_CHECK_CRON_NAME);
  }

  async handleHealthCheckCron(): Promise<void> {
    if (!this.config.get<boolean>('app.cron.enabled', true)) {
      return;
    }

    await this.cronLock.runExclusive(HEALTH_CHECK_CRON_NAME, async () => {
      try {
        const result = await this.runHealthCheck();
        const summary = Object.entries(result.details ?? {})
          .map(([key, detail]) => {
            const status =
              typeof detail === 'object' &&
              detail !== null &&
              'status' in detail
                ? String((detail as { status: string }).status)
                : 'unknown';
            return `${key}: ${status}`;
          })
          .join(', ');

        this.logger.log(`Scheduled health check OK (${summary})`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Health check failed';
        this.logger.error(`Scheduled health check failed: ${message}`);
      }
    });
  }

  async runHealthCheck(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
