/** S3 key segment grouping objects by domain use. */
export enum StorageObjectCategory {
  EVIDENCE = 'evidence',
  SIGNATURE = 'signature',
  EXPORT = 'export',
  ATTACHMENT = 'attachment',
  GENERAL = 'general',
}
