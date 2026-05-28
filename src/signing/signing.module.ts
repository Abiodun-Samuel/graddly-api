import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EsignatureModule } from '../esignature/esignature.module.js';
import { PdfGenerationJob } from '../pdf/entities/pdf-generation-job.entity.js';

import { SequentialCoSignOrchestrator } from './sequential-co-sign.orchestrator.js';

@Module({
  imports: [EsignatureModule, TypeOrmModule.forFeature([PdfGenerationJob])],
  providers: [SequentialCoSignOrchestrator],
  exports: [SequentialCoSignOrchestrator],
})
export class SigningModule {}
