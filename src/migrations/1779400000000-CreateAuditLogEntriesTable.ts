import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateAuditLogEntriesTable1779400000000 implements MigrationInterface {
  name = 'CreateAuditLogEntriesTable1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "audit_action" AS ENUM ('insert', 'update', 'delete')`,
    );

    await queryRunner.query(
      `CREATE TABLE "audit_log_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "actorUserId" uuid,
        "organisationId" uuid,
        "entityType" character varying(100) NOT NULL,
        "entityId" uuid NOT NULL,
        "action" "audit_action" NOT NULL,
        "changes" jsonb NOT NULL,
        CONSTRAINT "PK_audit_log_entries" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "audit_log_entries" ADD CONSTRAINT "FK_audit_log_entries_actorUserId" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log_entries" ADD CONSTRAINT "FK_audit_log_entries_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_org_created" ON "audit_log_entries" ("organisationId", "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_log_entity_created" ON "audit_log_entries" ("entityType", "entityId", "createdAt" DESC)`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(`
CREATE POLICY audit_log_entries_select ON audit_log_entries
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )`);

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

    await queryRunner.query(`
ALTER TABLE audit_log_entries ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE audit_log_entries FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE audit_log_entries NO FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
ALTER TABLE audit_log_entries DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS audit_log_entries_insert ON audit_log_entries`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS audit_log_entries_select ON audit_log_entries`,
    );

    await queryRunner.query(`DROP TABLE "audit_log_entries"`);
    await queryRunner.query(`DROP TYPE "audit_action"`);
  }
}
