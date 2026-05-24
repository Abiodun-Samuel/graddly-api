import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../email/email.module.js';
import { PdfGenerationJob } from '../pdf/entities/pdf-generation-job.entity.js';
import { PdfModule } from '../pdf/pdf.module.js';
import { StorageModule } from '../storage/storage.module.js';

import { BullmqModule } from './bullmq.module.js';
import { DigestProcessor } from './processors/digest.processor.js';
import { EmailSendProcessor } from './processors/email-send.processor.js';
import { PdfGenerationProcessor } from './processors/pdf-generation.processor.js';
import { SystemPingProcessor } from './processors/system-ping.processor.js';

@Module({
  imports: [
    BullmqModule,
    EmailModule,
    PdfModule,
    StorageModule,
    TypeOrmModule.forFeature([PdfGenerationJob]),
  ],
  providers: [
    SystemPingProcessor,
    EmailSendProcessor,
    DigestProcessor,
    PdfGenerationProcessor,
  ],
})
export class BullmqWorkerModule {}
