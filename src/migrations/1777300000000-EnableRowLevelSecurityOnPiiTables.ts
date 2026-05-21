import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

/**
 * Postgres RLS on PII / tenant tables (Phase C / ADR 0001).
 *
 * Session GUCs (set by TenantSessionSubscriber before each ORM query):
 *   app.current_org, app.current_user, app.rls_bootstrap
 *
 * Application DB role: provision outside migrations (see docs/database-setup.md).
 * Migrations run as migrator; the API uses a non-superuser without BYPASSRLS.
 */
export class EnableRowLevelSecurityOnPiiTables1777300000000 implements MigrationInterface {
  name = 'EnableRowLevelSecurityOnPiiTables1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await ensureRlsHelperFunctions(queryRunner);

    // --- organisations ---
    await queryRunner.query(`
CREATE POLICY organisations_select ON organisations
  FOR SELECT
  USING (
    id = app_current_org()
    OR app_user_member_of_org(id)
  )`);

    await queryRunner.query(`
CREATE POLICY organisations_insert ON organisations
  FOR INSERT
  WITH CHECK (app_current_user() IS NOT NULL)`);
    // Note: INSERT ... RETURNING also requires SELECT policy on the new row. Create org via
    // INSERT without RETURNING, then add membership, then SELECT (see OrganisationsService).

    await queryRunner.query(`
CREATE POLICY organisations_update ON organisations
  FOR UPDATE
  USING (id = app_current_org() OR app_user_member_of_org(id))
  WITH CHECK (id = app_current_org() OR app_user_member_of_org(id))`);

    await queryRunner.query(`
CREATE POLICY organisations_delete ON organisations
  FOR DELETE
  USING (id = app_current_org() OR app_user_member_of_org(id))`);

    // --- organisation_memberships ---
    await queryRunner.query(`
CREATE POLICY organisation_memberships_select ON organisation_memberships
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
    OR "organisationId" = app_current_org()
  )`);

    await queryRunner.query(`
CREATE POLICY organisation_memberships_insert ON organisation_memberships
  FOR INSERT
  WITH CHECK (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
    OR "organisationId" = app_current_org()
  )`);

    await queryRunner.query(`
CREATE POLICY organisation_memberships_update ON organisation_memberships
  FOR UPDATE
  USING ("organisationId" = app_current_org())
  WITH CHECK ("organisationId" = app_current_org())`);

    await queryRunner.query(`
CREATE POLICY organisation_memberships_delete ON organisation_memberships
  FOR DELETE
  USING ("organisationId" = app_current_org())`);

    // --- users (PII) ---
    await queryRunner.query(`
CREATE POLICY users_select ON users
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR id = app_current_user()
    OR app_user_in_current_org(id)
  )`);

    await queryRunner.query(`
CREATE POLICY users_insert ON users
  FOR INSERT
  WITH CHECK (app_rls_bootstrap())`);

    await queryRunner.query(`
CREATE POLICY users_update ON users
  FOR UPDATE
  USING (
    id = app_current_user()
    OR app_user_in_current_org(id)
  )
  WITH CHECK (
    id = app_current_user()
    OR app_user_in_current_org(id)
  )`);

    await queryRunner.query(`
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE organisation_memberships ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE users ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE organisations FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE organisation_memberships FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE users FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE users NO FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE organisation_memberships NO FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE organisations NO FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE users DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE organisation_memberships DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE organisations DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP POLICY IF EXISTS users_update ON users`);
    await queryRunner.query(`DROP POLICY IF EXISTS users_insert ON users`);
    await queryRunner.query(`DROP POLICY IF EXISTS users_select ON users`);

    await queryRunner.query(
      `DROP POLICY IF EXISTS organisation_memberships_delete ON organisation_memberships`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS organisation_memberships_update ON organisation_memberships`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS organisation_memberships_insert ON organisation_memberships`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS organisation_memberships_select ON organisation_memberships`,
    );

    await queryRunner.query(
      `DROP POLICY IF EXISTS organisations_delete ON organisations`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS organisations_update ON organisations`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS organisations_insert ON organisations`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS organisations_select ON organisations`,
    );

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_user_member_of_org(uuid)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_user_in_current_org(uuid)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_rls_bootstrap()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_current_user()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS app_current_org()`);
  }
}
