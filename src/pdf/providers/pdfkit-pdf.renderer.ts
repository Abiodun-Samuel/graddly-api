import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import type {
  IPdfRenderer,
  ISignedPdfOptions,
} from '../interfaces/pdf-renderer.interface.js';

function isPng(buffer: Buffer): boolean {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  return (
    buffer.length >= signature.length && buffer.subarray(0, 8).equals(signature)
  );
}

function renderToBuffer(
  build: (doc: InstanceType<typeof PDFDocument>) => void,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      build(doc);
      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

@Injectable()
export class PdfKitPdfRenderer implements IPdfRenderer {
  renderHelloPdf(): Promise<Buffer> {
    return renderToBuffer((doc) => {
      doc.fontSize(24).text('Hello from Graddly PDF', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('Phase J pdfkit baseline', { align: 'center' });
    });
  }

  embedSignature(
    unsignedPdf: Buffer,
    signaturePng: Buffer,
    options: ISignedPdfOptions,
  ): Promise<Buffer> {
    return renderToBuffer((doc) => {
      doc.fontSize(18).text('Signed document', { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).text(`Signed at: ${options.signedAt.toISOString()}`, {
        align: 'left',
      });
      if (options.signerLabel) {
        doc.text(`Signer: ${options.signerLabel}`);
      }
      doc.moveDown();
      doc.text(`Source document size: ${unsignedPdf.length} bytes`);
      doc.moveDown();
      if (isPng(signaturePng)) {
        doc.image(signaturePng, { fit: [200, 80] });
      } else {
        doc.text('Signature image unavailable.');
      }
    });
  }
}
