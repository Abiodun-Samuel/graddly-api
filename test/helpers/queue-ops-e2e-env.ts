import {
  parseEnvFromProcess,
  resetEnvCache,
} from '../../src/config/validate-env.js';

/** Min 32 chars — matches staging/production validation when ops is enabled. */
export const E2E_QUEUE_OPS_API_KEY = 'test-queue-ops-api-key-min-32-chars!!';

export function applyQueueOpsE2eEnv(): void {
  process.env.QUEUE_OPS_ENABLED = 'true';
  process.env.QUEUE_OPS_API_KEY = E2E_QUEUE_OPS_API_KEY;
  resetEnvCache();
  parseEnvFromProcess();
}

export function disableQueueOpsE2eEnv(): void {
  process.env.QUEUE_OPS_ENABLED = 'false';
  process.env.QUEUE_OPS_API_KEY = '';
  resetEnvCache();
  parseEnvFromProcess();
}
