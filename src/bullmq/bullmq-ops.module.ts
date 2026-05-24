import { Module } from '@nestjs/common';

import { BullmqJobInspectionService } from './bullmq-job-inspection.service.js';
import { BullmqOpsController } from './bullmq-ops.controller.js';
import { BullmqModule } from './bullmq.module.js';
import { QueueOpsApiKeyGuard } from './queue-ops-api-key.guard.js';

@Module({
  imports: [BullmqModule],
  controllers: [BullmqOpsController],
  providers: [BullmqJobInspectionService, QueueOpsApiKeyGuard],
  exports: [BullmqJobInspectionService],
})
export class BullmqOpsModule {}
