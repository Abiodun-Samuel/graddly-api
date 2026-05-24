import { ValidationException } from '../common/exceptions/validation.exception.js';

import { StorageValidationService } from './storage-validation.service.js';
import { MAX_FILE_SIZE_BYTES } from './storage.constants.js';

describe('StorageValidationService', () => {
  const service = new StorageValidationService();

  it('accepts allowed mime types within size limit', () => {
    expect(() =>
      service.assertUploadAllowed('application/pdf', 1024),
    ).not.toThrow();
  });

  it('rejects disallowed mime types', () => {
    expect(() =>
      service.assertUploadAllowed('application/x-msdownload', 1024),
    ).toThrow(ValidationException);
  });

  it('rejects files over 25 MB', () => {
    expect(() =>
      service.assertUploadAllowed('application/pdf', MAX_FILE_SIZE_BYTES + 1),
    ).toThrow(ValidationException);
  });

  it('rejects zero-length uploads', () => {
    expect(() => service.assertUploadAllowed('application/pdf', 0)).toThrow(
      ValidationException,
    );
  });
});
