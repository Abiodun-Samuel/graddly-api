import {
  getCurrentOrganisationId,
  runWithCorrelationId,
  setCurrentOrganisationId,
} from '../common/context/correlation-id-context.js';
import * as validateEnv from '../config/validate-env.js';

import { TenantSessionSubscriber } from './tenant-session.subscriber.js';

function minimalEnv(tenantDbContextEnabled: boolean) {
  /* eslint-disable @typescript-eslint/naming-convention -- keys mirror process.env */
  return {
    ...validateEnv.parseEnv({
      NODE_ENV: 'development',
      JWT_SECRET: 'change-me-in-production',
    }),
    TENANT_DB_CONTEXT_ENABLED: tenantDbContextEnabled,
  };
  /* eslint-enable @typescript-eslint/naming-convention */
}

describe('TenantSessionSubscriber', () => {
  const queryRunner = {
    query: jest.fn().mockResolvedValue(undefined),
  };

  const subscriber = new TenantSessionSubscriber();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(validateEnv, 'getEnv').mockReturnValue(minimalEnv(false));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does nothing when TENANT_DB_CONTEXT_ENABLED is false', async () => {
    jest.spyOn(validateEnv, 'getEnv').mockReturnValue(minimalEnv(false));
    await runWithCorrelationId('cid', async () => {
      setCurrentOrganisationId('550e8400-e29b-41d4-a716-446655440000');
      await subscriber.beforeQuery({ queryRunner } as never);
    });
    expect(queryRunner.query).not.toHaveBeenCalled();
  });

  it('does nothing when enabled but no org in ALS', async () => {
    jest.spyOn(validateEnv, 'getEnv').mockReturnValue(minimalEnv(true));
    await runWithCorrelationId('cid', async () => {
      await subscriber.beforeQuery({ queryRunner } as never);
    });
    expect(queryRunner.query).not.toHaveBeenCalled();
  });

  it('runs set_config when enabled and org id is set on the store', async () => {
    jest.spyOn(validateEnv, 'getEnv').mockReturnValue(minimalEnv(true));
    await runWithCorrelationId('cid', async () => {
      setCurrentOrganisationId('550e8400-e29b-41d4-a716-446655440000');
      await subscriber.beforeQuery({ queryRunner } as never);
    });
    expect(queryRunner.query).toHaveBeenCalledWith(
      `SELECT set_config('app.current_org', $1::text, false)`,
      ['550e8400-e29b-41d4-a716-446655440000'],
    );
  });

  it('reads org id from ALS set earlier in the request', async () => {
    jest.spyOn(validateEnv, 'getEnv').mockReturnValue(minimalEnv(true));
    await runWithCorrelationId('cid', async () => {
      setCurrentOrganisationId('org-x');
      expect(getCurrentOrganisationId()).toBe('org-x');
      await subscriber.beforeQuery({ queryRunner } as never);
    });
    expect(queryRunner.query).toHaveBeenCalledTimes(1);
  });
});
