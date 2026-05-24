/** DI token for the active storage provider (S3 or noop). */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

/** Maximum upload size (25 MB). */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** Allowed MIME types for presigned uploads. */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
