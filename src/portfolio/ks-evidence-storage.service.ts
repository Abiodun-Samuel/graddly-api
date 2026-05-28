import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { StorageObjectCategory } from '../storage/enums/storage-object-category.enum.js';
import { StorageKeyBuilder } from '../storage/storage-key.builder.js';

@Injectable()
export class KsEvidenceStorageService {
  constructor(private readonly keyBuilder: StorageKeyBuilder) {}

  assertEvidenceStorageKey(
    organisationId: string,
    apprenticeId: string,
    storageKey: string,
  ): void {
    if (!this.keyBuilder.belongsToOrganisation(storageKey, organisationId)) {
      throw new ForbiddenException('Storage key is not in this organisation');
    }

    const expectedPrefix = `orgs/${organisationId}/learners/${apprenticeId}/evidence/`;
    if (!storageKey.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        'Storage key must be an evidence object for this apprentice',
      );
    }
  }

  expectedEvidenceKeyPrefix(
    organisationId: string,
    apprenticeId: string,
  ): string {
    return `orgs/${organisationId}/learners/${apprenticeId}/${StorageObjectCategory.EVIDENCE}/`;
  }
}
