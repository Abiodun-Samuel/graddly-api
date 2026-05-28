import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { PdfGenerationJob } from '../pdf/entities/pdf-generation-job.entity.js';
import { PdfModule } from '../pdf/pdf.module.js';
import { StorageModule } from '../storage/storage.module.js';

import { SignatureRecord } from './entities/signature-record.entity.js';
import { EsignatureController } from './esignature.controller.js';
import { EsignatureService } from './esignature.service.js';

@Module({
  imports: [
    AuthModule,
    PdfModule,
    StorageModule,
    TypeOrmModule.forFeature([SignatureRecord, PdfGenerationJob]),
  ],
  controllers: [EsignatureController],
  providers: [EsignatureService],
  exports: [EsignatureService],
})
export class EsignatureModule {}
