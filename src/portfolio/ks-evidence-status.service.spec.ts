import { BadRequestException } from '@nestjs/common';

import { KsEvidenceStatus } from './enums/ks-evidence-status.enum.js';
import { KsEvidenceStatusService } from './ks-evidence-status.service.js';

describe('KsEvidenceStatusService', () => {
  const service = new KsEvidenceStatusService();

  it('allows draft to submitted', () => {
    expect(() =>
      service.applyTransition(
        KsEvidenceStatus.DRAFT,
        KsEvidenceStatus.SUBMITTED,
      ),
    ).not.toThrow();
  });

  it('rejects draft to accepted', () => {
    expect(() =>
      service.applyTransition(
        KsEvidenceStatus.DRAFT,
        KsEvidenceStatus.ACCEPTED,
      ),
    ).toThrow(BadRequestException);
  });

  it('allows return from submitted or reviewed', () => {
    expect(service.canReturnToDraft(KsEvidenceStatus.SUBMITTED)).toBe(true);
    expect(service.canReturnToDraft(KsEvidenceStatus.REVIEWED)).toBe(true);
    expect(service.canReturnToDraft(KsEvidenceStatus.DRAFT)).toBe(false);
  });
});
