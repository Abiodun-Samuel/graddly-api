import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';

import { StorageObjectCategory } from './enums/storage-object-category.enum.js';

export interface IBuildStorageKeyParams {
  organisationId: string;
  category: StorageObjectCategory;
  filename: string;
  learnerId?: string;
  objectId?: string;
}

@Injectable()
export class StorageKeyBuilder {
  build(params: IBuildStorageKeyParams): string {
    const sanitizedFilename = this.sanitizeFilename(params.filename);
    const objectId = params.objectId ?? uuidV4();
    const category = params.category;

    if (params.learnerId) {
      return [
        'orgs',
        params.organisationId,
        'learners',
        params.learnerId,
        category,
        objectId,
        sanitizedFilename,
      ].join('/');
    }

    return [
      'orgs',
      params.organisationId,
      category,
      objectId,
      sanitizedFilename,
    ].join('/');
  }

  belongsToOrganisation(key: string, organisationId: string): boolean {
    const prefix = `orgs/${organisationId}/`;
    return key.startsWith(prefix);
  }

  sanitizeFilename(filename: string): string {
    const basename = filename.split(/[/\\]/u).pop()?.trim() ?? '';
    if (!basename) {
      throw new BadRequestException('Filename is required');
    }

    const sanitized = basename
      .replace(/[^\w.\- ]+/gu, '_')
      .replace(/\s+/gu, '-')
      .slice(0, 200);

    if (!sanitized || sanitized === '.' || sanitized === '..') {
      throw new BadRequestException('Invalid filename');
    }

    return sanitized;
  }
}
