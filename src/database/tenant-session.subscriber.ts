import { EntitySubscriberInterface, type BeforeQueryEvent } from 'typeorm';

import { getCurrentOrganisationId } from '../common/context/correlation-id-context.js';
import { getEnv } from '../config/validate-env.js';

/**
 * Before each ORM query, when tenant DB context is enabled and
 * `getCurrentOrganisationId()` is set (see ActiveOrganisationGuard),
 * sets PostgreSQL `app.current_org` on the same connection used for the query.
 *
 * Enabled flag is read from env (`TENANT_DB_CONTEXT_ENABLED`) on each query so
 * TypeORM can register this class without constructor args (Nest `subscribers` typing).
 *
 * This runs after membership lookups that establish the active org; those
 * queries run without this GUC by design. Optional RLS policies can treat
 * membership tables differently (see Phase C).
 */
export class TenantSessionSubscriber implements EntitySubscriberInterface {
  async beforeQuery(event: BeforeQueryEvent<unknown>): Promise<void> {
    if (!getEnv().TENANT_DB_CONTEXT_ENABLED) {
      return;
    }
    const orgId = getCurrentOrganisationId();
    if (!orgId) {
      return;
    }
    await event.queryRunner.query(
      `SELECT set_config('app.current_org', $1::text, false)`,
      [orgId],
    );
  }
}
