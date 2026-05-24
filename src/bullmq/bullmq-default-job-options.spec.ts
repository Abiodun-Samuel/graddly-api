import { bullmqDefaultJobOptions } from './bullmq-default-job-options.js';

describe('bullmqDefaultJobOptions', () => {
  it('defines retry, backoff, and retention defaults', () => {
    expect(bullmqDefaultJobOptions).toMatchObject({
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
    });
  });
});
