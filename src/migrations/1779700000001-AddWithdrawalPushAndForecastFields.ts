import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class AddWithdrawalPushAndForecastFields1779700000001 implements MigrationInterface {
  name = 'AddWithdrawalPushAndForecastFields1779700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "withdrawal_push_status" AS ENUM ('queued', 'processing', 'delivered', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "withdrawal_completion_pushes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "enrolmentId" uuid,
        "apprenticeId" uuid,
        "status" "withdrawal_push_status" NOT NULL DEFAULT 'queued',
        "attempts" integer NOT NULL DEFAULT 0,
        "lastError" text,
        "nextRetryAt" TIMESTAMP WITH TIME ZONE,
        "deliveredAt" TIMESTAMP WITH TIME ZONE,
        "manualRetryRequestedAt" TIMESTAMP WITH TIME ZONE,
        "payload" jsonb NOT NULL,
        CONSTRAINT "PK_withdrawal_completion_pushes" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "withdrawal_completion_pushes" ADD CONSTRAINT "FK_withdrawal_completion_pushes_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_completion_pushes" ADD CONSTRAINT "FK_withdrawal_completion_pushes_enrolmentId" FOREIGN KEY ("enrolmentId") REFERENCES "enrolments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawal_completion_pushes" ADD CONSTRAINT "FK_withdrawal_completion_pushes_apprenticeId" FOREIGN KEY ("apprenticeId") REFERENCES "apprentices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_withdrawal_push_org_status_created" ON "withdrawal_completion_pushes" ("organisationId", "status", "createdAt")`,
    );

    await queryRunner.query(
      `ALTER TABLE "standards" ADD COLUMN "fundingBandMax" numeric(14,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "standards" ADD COLUMN "defaultDurationMonths" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" ADD COLUMN "agreedPrice" numeric(14,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" ADD COLUMN "plannedStartDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" ADD COLUMN "plannedEndDate" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" ADD COLUMN "plannedDurationMonths" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" ADD COLUMN "completionPaymentPercent" numeric(5,2)`,
    );

    await ensureRlsHelperFunctions(queryRunner);
    await queryRunner.query(`
CREATE POLICY withdrawal_completion_pushes_select ON withdrawal_completion_pushes
  FOR SELECT
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY withdrawal_completion_pushes_insert ON withdrawal_completion_pushes
  FOR INSERT
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY withdrawal_completion_pushes_update ON withdrawal_completion_pushes
  FOR UPDATE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY withdrawal_completion_pushes_delete ON withdrawal_completion_pushes
  FOR DELETE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(
      `ALTER TABLE withdrawal_completion_pushes ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE withdrawal_completion_pushes FORCE ROW LEVEL SECURITY`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE withdrawal_completion_pushes NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE withdrawal_completion_pushes DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS withdrawal_completion_pushes_delete ON withdrawal_completion_pushes`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS withdrawal_completion_pushes_update ON withdrawal_completion_pushes`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS withdrawal_completion_pushes_insert ON withdrawal_completion_pushes`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS withdrawal_completion_pushes_select ON withdrawal_completion_pushes`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_withdrawal_push_org_status_created"`,
    );
    await queryRunner.query(`DROP TABLE "withdrawal_completion_pushes"`);
    await queryRunner.query(`DROP TYPE "withdrawal_push_status"`);

    await queryRunner.query(
      `ALTER TABLE "enrolments" DROP COLUMN "completionPaymentPercent"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" DROP COLUMN "plannedDurationMonths"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" DROP COLUMN "plannedEndDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" DROP COLUMN "plannedStartDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" DROP COLUMN "agreedPrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standards" DROP COLUMN "defaultDurationMonths"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standards" DROP COLUMN "fundingBandMax"`,
    );
  }
}
