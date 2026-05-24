/** Queue for transactional email jobs (Phase G). */
export const QUEUE_EMAIL = 'email';

/** Queue for digest notifications (Phase G). */
export const QUEUE_DIGEST = 'digest';

/** Weekly OTJ digest job (domain wiring in Phase M). */
export const DIGEST_JOB_WEEKLY_OTJ = 'weekly-otj-digest';

/** Queue for async PDF generation (Phase J). */
export const QUEUE_PDF = 'pdf';

/** Queue for DAS organisation sync jobs (Phase L). */
export const QUEUE_DAS_SYNC = 'das-sync';

/** Internal queue for smoke / health jobs. */
export const QUEUE_SYSTEM = 'system';

export const BULLMQ_QUEUES = [
  QUEUE_EMAIL,
  QUEUE_DIGEST,
  QUEUE_PDF,
  QUEUE_DAS_SYNC,
  QUEUE_SYSTEM,
] as const;

export const SYSTEM_JOB_PING = 'ping';
