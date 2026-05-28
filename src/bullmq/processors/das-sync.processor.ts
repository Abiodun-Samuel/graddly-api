import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import {
  setCurrentOrganisationId,
  setCurrentUserId,
} from '../../common/context/correlation-id-context.js';
import { DAS_JOB_SYNC_ORGANISATION } from '../../das/das-job.constants.js';
import { DasLevySyncService } from '../../das/das-levy-sync.service.js';
import { setLastKnownUserIdForGuc } from '../../database/apply-tenant-gucs.js';
import { QUEUE_DAS_SYNC } from '../bullmq.constants.js';

import type { IDasSyncJobPayload } from '../../das/das-job.payload.js';

@Processor(QUEUE_DAS_SYNC)
export class DasSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(DasSyncProcessor.name);

  constructor(private readonly dasSyncService: DasLevySyncService) {
    super();
  }

  async process(job: Job<IDasSyncJobPayload>): Promise<void> {
    if (job.name !== DAS_JOB_SYNC_ORGANISATION) {
      this.logger.warn(
        `Unknown job name "${job.name}" on ${QUEUE_DAS_SYNC} queue (job ${job.id})`,
      );
      return;
    }

    const { organisationId, requestedByUserId } = job.data;
    setCurrentOrganisationId(organisationId);
    setCurrentUserId(requestedByUserId ?? 'system-das-sync');
    setLastKnownUserIdForGuc(requestedByUserId ?? 'system-das-sync');

    await this.dasSyncService.syncOrganisation(
      organisationId,
      requestedByUserId,
    );
  }
}
