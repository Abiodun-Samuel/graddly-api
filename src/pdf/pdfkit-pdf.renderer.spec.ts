import { PdfKitPdfRenderer } from './providers/pdfkit-pdf.renderer.js';

describe('PdfKitPdfRenderer', () => {
  const renderer = new PdfKitPdfRenderer();

  it('renderHelloPdf returns a PDF buffer', async () => {
    const buffer = await renderer.renderHelloPdf();
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('embedSignature returns a PDF buffer without a valid PNG', async () => {
    const unsigned = await renderer.renderHelloPdf();
    const signed = await renderer.embedSignature(
      unsigned,
      Buffer.from('not-a-png'),
      {
        signedAt: new Date('2026-01-01T00:00:00.000Z'),
        signerLabel: 'signer@example.com',
      },
    );
    expect(signed.subarray(0, 4).toString()).toBe('%PDF');
  });
});
