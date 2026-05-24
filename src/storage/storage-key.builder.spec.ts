import { BadRequestException } from '@nestjs/common';

import { StorageObjectCategory } from './enums/storage-object-category.enum.js';
import { StorageKeyBuilder } from './storage-key.builder.js';

describe('StorageKeyBuilder', () => {
  const builder = new StorageKeyBuilder();
  const orgId = '11111111-1111-1111-1111-111111111111';
  const learnerId = '22222222-2222-2222-2222-222222222222';

  it('builds org-level keys without learner', () => {
    const key = builder.build({
      organisationId: orgId,
      category: StorageObjectCategory.GENERAL,
      filename: 'report.pdf',
      objectId: 'obj-1',
    });

    expect(key).toBe(`orgs/${orgId}/general/obj-1/report.pdf`);
  });

  it('builds learner-scoped keys', () => {
    const key = builder.build({
      organisationId: orgId,
      learnerId,
      category: StorageObjectCategory.EVIDENCE,
      filename: 'photo.jpg',
      objectId: 'obj-2',
    });

    expect(key).toBe(
      `orgs/${orgId}/learners/${learnerId}/evidence/obj-2/photo.jpg`,
    );
  });

  it('sanitizes path segments from filenames', () => {
    const key = builder.build({
      organisationId: orgId,
      category: StorageObjectCategory.ATTACHMENT,
      filename: '../../etc/passwd',
      objectId: 'obj-3',
    });

    expect(key).toBe(`orgs/${orgId}/attachment/obj-3/passwd`);
  });

  it('checks organisation prefix for download auth', () => {
    const key = `orgs/${orgId}/general/obj/file.pdf`;
    expect(builder.belongsToOrganisation(key, orgId)).toBe(true);
    expect(
      builder.belongsToOrganisation(
        key,
        '99999999-9999-9999-9999-999999999999',
      ),
    ).toBe(false);
  });

  it('rejects empty filenames', () => {
    expect(() =>
      builder.build({
        organisationId: orgId,
        category: StorageObjectCategory.GENERAL,
        filename: '   ',
      }),
    ).toThrow(BadRequestException);
  });
});
