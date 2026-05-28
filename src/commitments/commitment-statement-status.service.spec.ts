import { BadRequestException } from '@nestjs/common';

import { CommitmentStatementStatusService } from './commitment-statement-status.service.js';
import { CommitmentStatementStatus } from './enums/commitment-statement-status.enum.js';

describe('CommitmentStatementStatusService', () => {
  const service = new CommitmentStatementStatusService();

  it('allows draft to submitted and cancelled', () => {
    expect(() =>
      service.applyTransition(
        CommitmentStatementStatus.DRAFT,
        CommitmentStatementStatus.SUBMITTED,
      ),
    ).not.toThrow();
    expect(() =>
      service.applyTransition(
        CommitmentStatementStatus.DRAFT,
        CommitmentStatementStatus.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects invalid transitions', () => {
    expect(() =>
      service.applyTransition(
        CommitmentStatementStatus.DRAFT,
        CommitmentStatementStatus.SIGNED,
      ),
    ).toThrow(BadRequestException);
  });

  it('allows new version only when signed or cancelled', () => {
    expect(service.canCreateNewVersion(CommitmentStatementStatus.SIGNED)).toBe(
      true,
    );
    expect(
      service.canCreateNewVersion(CommitmentStatementStatus.CANCELLED),
    ).toBe(true);
    expect(service.canCreateNewVersion(CommitmentStatementStatus.DRAFT)).toBe(
      false,
    );
  });
});
