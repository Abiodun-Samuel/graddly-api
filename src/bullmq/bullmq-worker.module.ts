import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module.js';

import { BullmqModule } from './bullmq.module.js';
import { DigestProcessor } from './processors/digest.processor.js';
import { EmailSendProcessor } from './processors/email-send.processor.js';
import { SystemPingProcessor } from './processors/system-ping.processor.js';

@Module({
  imports: [BullmqModule, EmailModule],
  providers: [SystemPingProcessor, EmailSendProcessor, DigestProcessor],
})
export class BullmqWorkerModule {}
