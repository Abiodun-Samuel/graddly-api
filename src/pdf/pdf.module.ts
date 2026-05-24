import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { StorageModule } from '../storage/storage.module.js';

import { PdfGenerationJob } from './entities/pdf-generation-job.entity.js';
import { PdfDispatchService } from './pdf-dispatch.service.js';
import { PdfJobsService } from './pdf-jobs.service.js';
import { PDF_RENDERER } from './pdf.constants.js';
import { PdfController } from './pdf.controller.js';
import { PdfService } from './pdf.service.js';
import { NoopPdfRenderer } from './providers/noop-pdf.renderer.js';
import { PdfKitPdfRenderer } from './providers/pdfkit-pdf.renderer.js';

import type { IPdfRenderer } from './interfaces/pdf-renderer.interface.js';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    TypeOrmModule.forFeature([PdfGenerationJob]),
  ],
  controllers: [PdfController],
  providers: [
    PdfService,
    PdfDispatchService,
    PdfJobsService,
    PdfKitPdfRenderer,
    NoopPdfRenderer,
    {
      provide: PDF_RENDERER,
      useFactory: (
        config: ConfigService,
        pdfkit: PdfKitPdfRenderer,
        noop: NoopPdfRenderer,
      ): IPdfRenderer => {
        const provider = config.get<'pdfkit' | 'noop'>(
          'app.pdf.provider',
          'pdfkit',
        );
        return provider === 'noop' ? noop : pdfkit;
      },
      inject: [ConfigService, PdfKitPdfRenderer, NoopPdfRenderer],
    },
  ],
  exports: [PdfService, PdfDispatchService],
})
export class PdfModule {}
