import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateOtjLogEntriesTable1779800000000 implements MigrationInterface {
  name = 'CreateOtjLogEntriesTable1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "otj_log_status" AS ENUM ('draft', 'submitted', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "otj_log_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "enrolmentId" uuid NOT NULL,
        "apprenticeId" uuid NOT NULL,
        "loggedDate" date NOT NULL,
        "minutes" integer NOT NULL,
        "note" text,
        "evidence" jsonb,
        "status" "otj_log_status" NOT NULL DEFAULT 'draft',
        "approvedByUserId" uuid,
        "approvedAt" TIMESTAMP WITH TIME ZONE,
        "rejectedByUserId" uuid,
        "rejectedAt" TIMESTAMP WITH TIME ZONE,
        "rejectionReason" text,
        "paceFlag" character varying(30),
        CONSTRAINT "PK_otj_log_entries" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "otj_log_entries" ADD CONSTRAINT "FK_otj_log_entries_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "otj_log_entries" ADD CONSTRAINT "FK_otj_log_entries_enrolmentId" FOREIGN KEY ("enrolmentId") REFERENCES "enrolments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "otj_log_entries" ADD CONSTRAINT "FK_otj_log_entries_apprenticeId" FOREIGN KEY ("apprenticeId") REFERENCES "apprentices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_otj_log_entries_org_status_created" ON "otj_log_entries" ("organisationId", "status", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_otj_log_entries_org_apprentice_logged_date" ON "otj_log_entries" ("organisationId", "apprenticeId", "loggedDate")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_otj_log_entries_org_enrolment_logged_date" ON "otj_log_entries" ("organisationId", "enrolmentId", "loggedDate")`,
    );

    await ensureRlsHelperFunctions(queryRunner);
    await queryRunner.query(`
CREATE POLICY otj_log_entries_select ON otj_log_entries
  FOR SELECT
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY otj_log_entries_insert ON otj_log_entries
  FOR INSERT
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY otj_log_entries_update ON otj_log_entries
  FOR UPDATE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY otj_log_entries_delete ON otj_log_entries
  FOR DELETE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(
      `ALTER TABLE otj_log_entries ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE otj_log_entries FORCE ROW LEVEL SECURITY`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE otj_log_entries NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE otj_log_entries DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS otj_log_entries_delete ON otj_log_entries`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS otj_log_entries_update ON otj_log_entries`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS otj_log_entries_insert ON otj_log_entries`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS otj_log_entries_select ON otj_log_entries`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_otj_log_entries_org_enrolment_logged_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_otj_log_entries_org_apprentice_logged_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_otj_log_entries_org_status_created"`,
    );
    await queryRunner.query(`DROP TABLE "otj_log_entries"`);
    await queryRunner.query(`DROP TYPE "otj_log_status"`);
  }
}
