export interface ISignedPdfOptions {
  signedAt: Date;
  signerLabel?: string;
}

export interface IReviewSnapshotContent {
  title: string | null;
  scheduledAt: string;
  apprenticeName: string;
  progressSummary?: string;
  actionsAgreed?: string;
  employerComments?: string;
  smartGoals?: Array<{
    objective: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  }>;
  wellbeingScore?: number;
  wellbeingNotes?: string;
}

export interface IPdfRenderer {
  renderHelloPdf(): Promise<Buffer>;
  renderReviewSnapshot(content: IReviewSnapshotContent): Promise<Buffer>;
  embedSignature(
    unsignedPdf: Buffer,
    signaturePng: Buffer,
    options: ISignedPdfOptions,
  ): Promise<Buffer>;
}
