import { PostgresQueryRunner } from 'typeorm/driver/postgres/PostgresQueryRunner.js';

import {
  applyTenantGucs,
  isTenantGucQuery,
  setGucQueryRunner,
} from './apply-tenant-gucs.js';

let patched = false;

type PostgresQueryMethod = (
  this: PostgresQueryRunner,
  query: string,
  parameters?: unknown[],
  useStructuredResult?: boolean,
) => Promise<unknown>;

/**
 * TypeORM 0.3.28 does not invoke EntitySubscriberInterface.beforeQuery.
 * Patch PostgresQueryRunner.query to set tenant GUCs before each SQL statement.
 */
export function patchPostgresQueryRunnerForTenantGucs(): void {
  if (patched) {
    return;
  }
  patched = true;

  const queryDescriptor = Object.getOwnPropertyDescriptor(
    PostgresQueryRunner.prototype,
    'query',
  );
  const queryImpl: unknown = queryDescriptor?.value;
  if (typeof queryImpl !== 'function') {
    throw new Error('PostgresQueryRunner.prototype.query is not a function');
  }
  const originalQuery = queryImpl as PostgresQueryMethod;

  setGucQueryRunner(originalQuery);

  PostgresQueryRunner.prototype.query = async function (
    this: PostgresQueryRunner,
    query: string,
    parameters?: unknown[],
    useStructuredResult?: boolean,
  ): Promise<unknown> {
    if (typeof query === 'string' && !isTenantGucQuery(query)) {
      await applyTenantGucs(this);
    }
    return originalQuery.call(this, query, parameters, useStructuredResult);
  };
}

patchPostgresQueryRunnerForTenantGucs();
