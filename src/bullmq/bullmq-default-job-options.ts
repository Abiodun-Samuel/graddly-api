import type { JobsOptions } from 'bullmq';

/** Shared defaults for all queues unless overridden per job. */
export const bullmqDefaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: {
    age: 86_400,
    count: 1000,
  },
  removeOnFail: false,
};
