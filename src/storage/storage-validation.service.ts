import { Injectable } from '@nestjs/common';

import { ValidationException } from '../common/exceptions/validation.exception.js';

import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from './storage.constants.js';

@Injectable()
export class StorageValidationService {
  assertUploadAllowed(contentType: string, contentLength: number): void {
    const errors: Record<string, string> = {};

    if (
      !ALLOWED_MIME_TYPES.includes(
        contentType as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      errors.contentType = `Content type "${contentType}" is not allowed for upload`;
    }

    if (contentLength <= 0) {
      errors.contentLength = 'Content length must be greater than zero';
    } else if (contentLength > MAX_FILE_SIZE_BYTES) {
      errors.contentLength = `File size exceeds the maximum of ${MAX_FILE_SIZE_BYTES} bytes (25 MB)`;
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException(errors);
    }
  }
}
