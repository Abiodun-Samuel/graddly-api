import { Module } from '@nestjs/common';

import { BullmqModule } from './bullmq.module.js';
import { SystemPingProcessor } from './processors/system-ping.processor.js';

@Module({
  imports: [BullmqModule],
  providers: [SystemPingProcessor],
})
export class BullmqWorkerModule {}
