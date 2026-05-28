import { BadRequestException, Injectable } from '@nestjs/common';

import { KsEvidenceStatus } from './enums/ks-evidence-status.enum.js';

@Injectable()
export class KsEvidenceStatusService {
  applyTransition(current: KsEvidenceStatus, target: KsEvidenceStatus): void {
    if (current === target) return;

    const allowed = TRANSITIONS[current];
    if (!allowed?.includes(target)) {
      throw new BadRequestException(
        `Cannot transition KSB evidence from ${current} to ${target}`,
      );
    }
  }

  canReturnToDraft(current: KsEvidenceStatus): boolean {
    return (
      current === KsEvidenceStatus.SUBMITTED ||
      current === KsEvidenceStatus.REVIEWED
    );
  }
}

const TRANSITIONS: Record<KsEvidenceStatus, KsEvidenceStatus[]> = {
  [KsEvidenceStatus.DRAFT]: [KsEvidenceStatus.SUBMITTED],
  [KsEvidenceStatus.SUBMITTED]: [KsEvidenceStatus.REVIEWED],
  [KsEvidenceStatus.REVIEWED]: [KsEvidenceStatus.ACCEPTED],
  [KsEvidenceStatus.ACCEPTED]: [],
};
