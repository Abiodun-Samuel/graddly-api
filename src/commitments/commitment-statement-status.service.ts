import { BadRequestException, Injectable } from '@nestjs/common';

import { CommitmentStatementStatus } from './enums/commitment-statement-status.enum.js';

@Injectable()
export class CommitmentStatementStatusService {
  applyTransition(
    current: CommitmentStatementStatus,
    target: CommitmentStatementStatus,
  ): void {
    if (current === target) return;

    const allowed = TRANSITIONS[current];
    if (!allowed?.includes(target)) {
      throw new BadRequestException(
        `Cannot transition commitment statement from ${current} to ${target}`,
      );
    }
  }

  canCreateNewVersion(current: CommitmentStatementStatus): boolean {
    return (
      current === CommitmentStatementStatus.SIGNED ||
      current === CommitmentStatementStatus.CANCELLED
    );
  }
}

const TRANSITIONS: Record<
  CommitmentStatementStatus,
  CommitmentStatementStatus[]
> = {
  [CommitmentStatementStatus.DRAFT]: [
    CommitmentStatementStatus.SUBMITTED,
    CommitmentStatementStatus.CANCELLED,
  ],
  [CommitmentStatementStatus.SUBMITTED]: [
    CommitmentStatementStatus.AWAITING_SIGNATURES,
    CommitmentStatementStatus.CANCELLED,
  ],
  [CommitmentStatementStatus.AWAITING_SIGNATURES]: [
    CommitmentStatementStatus.SIGNED,
    CommitmentStatementStatus.CANCELLED,
  ],
  [CommitmentStatementStatus.SIGNED]: [CommitmentStatementStatus.SUPERSEDED],
  [CommitmentStatementStatus.SUPERSEDED]: [],
  [CommitmentStatementStatus.CANCELLED]: [],
};
