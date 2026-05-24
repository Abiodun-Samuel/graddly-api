export interface ISignedPdfOptions {
  signedAt: Date;
  signerLabel?: string;
}

export interface IPdfRenderer {
  renderHelloPdf(): Promise<Buffer>;
  embedSignature(
    unsignedPdf: Buffer,
    signaturePng: Buffer,
    options: ISignedPdfOptions,
  ): Promise<Buffer>;
}
