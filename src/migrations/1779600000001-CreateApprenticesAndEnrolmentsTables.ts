import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateApprenticesAndEnrolmentsTables1779600000001 implements MigrationInterface {
  name = 'CreateApprenticesAndEnrolmentsTables1779600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "apprentice_status" AS ENUM ('pending', 'active', 'paused', 'completed', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TYPE "enrolment_status" AS ENUM ('draft', 'active', 'completed', 'cancelled')`,
    );

    await queryRunner.query(
      `CREATE TABLE "apprentices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100) NOT NULL,
        "email" character varying(320) NOT NULL,
        "status" "apprentice_status" NOT NULL DEFAULT 'pending',
        CONSTRAINT "PK_apprentices" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "enrolments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "apprenticeId" uuid NOT NULL,
        "standardId" uuid NOT NULL,
        "status" "enrolment_status" NOT NULL DEFAULT 'draft',
        "activatedAt" TIMESTAMP WITH TIME ZONE,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "cancelledAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_enrolments" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "apprentices" ADD CONSTRAINT "FK_apprentices_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" ADD CONSTRAINT "FK_enrolments_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" ADD CONSTRAINT "FK_enrolments_apprenticeId" FOREIGN KEY ("apprenticeId") REFERENCES "apprentices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolments" ADD CONSTRAINT "FK_enrolments_standardId" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_apprentices_active_org_email" ON "apprentices" ("organisationId", "email") WHERE "isDeleted" = false`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_enrolments_active_org_apprentice_standard" ON "enrolments" ("organisationId", "apprenticeId", "standardId") WHERE "isDeleted" = false AND "status" IN ('draft', 'active')`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_apprentices_org_created" ON "apprentices" ("organisationId", "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_enrolments_org_created" ON "enrolments" ("organisationId", "createdAt" DESC)`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(`
CREATE POLICY apprentices_select ON apprentices
  FOR SELECT
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY apprentices_insert ON apprentices
  FOR INSERT
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY apprentices_update ON apprentices
  FOR UPDATE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY apprentices_delete ON apprentices
  FOR DELETE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(`
CREATE POLICY enrolments_select ON enrolments
  FOR SELECT
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY enrolments_insert ON enrolments
  FOR INSERT
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY enrolments_update ON enrolments
  FOR UPDATE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY enrolments_delete ON enrolments
  FOR DELETE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(
      `ALTER TABLE apprentices ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`ALTER TABLE apprentices FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE enrolments ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE enrolments FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE enrolments NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE enrolments DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE apprentices NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE apprentices DISABLE ROW LEVEL SECURITY`,
    );

    await queryRunner.query(
      `DROP POLICY IF EXISTS enrolments_delete ON enrolments`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS enrolments_update ON enrolments`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS enrolments_insert ON enrolments`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS enrolments_select ON enrolments`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS apprentices_delete ON apprentices`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS apprentices_update ON apprentices`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS apprentices_insert ON apprentices`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS apprentices_select ON apprentices`,
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_enrolments_org_created"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_apprentices_org_created"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_enrolments_active_org_apprentice_standard"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_apprentices_active_org_email"`,
    );

    await queryRunner.query(`DROP TABLE "enrolments"`);
    await queryRunner.query(`DROP TABLE "apprentices"`);
    await queryRunner.query(`DROP TYPE "enrolment_status"`);
    await queryRunner.query(`DROP TYPE "apprentice_status"`);
  }
}
