import { Inject, Injectable } from '@nestjs/common';

import { PDF_RENDERER } from './pdf.constants.js';

import type {
  IPdfRenderer,
  ISignedPdfOptions,
} from './interfaces/pdf-renderer.interface.js';

@Injectable()
export class PdfService {
  constructor(@Inject(PDF_RENDERER) private readonly renderer: IPdfRenderer) {}

  renderHelloPdf(): Promise<Buffer> {
    return this.renderer.renderHelloPdf();
  }

  embedSignature(
    unsignedPdf: Buffer,
    signaturePng: Buffer,
    options: ISignedPdfOptions,
  ): Promise<Buffer> {
    return this.renderer.embedSignature(unsignedPdf, signaturePng, options);
  }
}
