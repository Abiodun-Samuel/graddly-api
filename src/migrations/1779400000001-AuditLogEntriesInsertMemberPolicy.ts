import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

/**
 * Org creation inserts membership before app.current_org is set; allow audit rows
 * when the actor is already a member of the target organisation.
 */
export class AuditLogEntriesInsertMemberPolicy1779400000001 implements MigrationInterface {
  name = 'AuditLogEntriesInsertMemberPolicy1779400000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(
      `DROP POLICY IF EXISTS audit_log_entries_insert ON audit_log_entries`,
    );
    await queryRunner.query(`
CREATE POLICY audit_log_entries_insert ON audit_log_entries
  FOR INSERT
  WITH CHECK (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
    OR (
      app_current_user() IS NOT NULL
      AND "organisationId" IS NOT NULL
      AND app_user_member_of_org("organisationId")
    )
  )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS audit_log_entries_insert ON audit_log_entries`,
    );
    await queryRunner.query(`
CREATE POLICY audit_log_entries_insert ON audit_log_entries
  FOR INSERT
  WITH CHECK (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )`);
  }
}
