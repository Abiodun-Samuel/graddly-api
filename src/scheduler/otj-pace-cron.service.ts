import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { OtjPaceService } from '../otj/otj-pace.service.js';

import { CronLockService } from './cron-lock.service.js';
import { OTJ_PACE_CRON_NAME } from './scheduler.constants.js';

@Injectable()
export class OtjPaceCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OtjPaceCronService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly cronLock: CronLockService,
    private readonly paceService: OtjPaceService,
  ) {}

  onModuleInit(): void {
    if (!this.config.get<boolean>('app.cron.enabled', true)) return;
    if (!this.config.get<boolean>('app.cron.otjPaceEnabled', false)) return;

    const expression = this.config.get<string>(
      'app.cron.otjPaceSchedule',
      '0 1 * * *',
    );
    const job = new CronJob(expression, () => {
      void this.handleOtjPaceCron();
    });
    this.schedulerRegistry.addCronJob(OTJ_PACE_CRON_NAME, job);
    job.start();
    this.logger.log(`Registered "${OTJ_PACE_CRON_NAME}" cron (${expression})`);
  }

  onModuleDestroy(): void {
    if (!this.schedulerRegistry.doesExist('cron', OTJ_PACE_CRON_NAME)) return;
    const job = this.schedulerRegistry.getCronJob(OTJ_PACE_CRON_NAME);
    void job.stop();
    this.schedulerRegistry.deleteCronJob(OTJ_PACE_CRON_NAME);
  }

  async handleOtjPaceCron(): Promise<void> {
    await this.cronLock.runExclusive(OTJ_PACE_CRON_NAME, async () => {
      const updated = await this.paceService.flagPaceForAllActiveEnrolments();
      this.logger.log(`OTJ pace cron updated ${updated} entries`);
    });
  }
}
