import type { TripartiteParty } from './tripartite-party.enum.js';

export type SigningSlotStatus = 'pending' | 'signed';

export interface ISigningSlot {
  party: TripartiteParty;
  signOrder: number;
  signerUserId: string;
  status: SigningSlotStatus;
  signatureRecordId: string | null;
}

export interface ISequentialSignResult {
  party: TripartiteParty;
  signedPdfKey: string;
  downloadUrl?: string;
  downloadExpiresAt?: string;
  signatureRecordId: string;
  nextParty: TripartiteParty | null;
}
