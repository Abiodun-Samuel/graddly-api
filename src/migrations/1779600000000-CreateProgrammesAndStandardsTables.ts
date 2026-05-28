import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateProgrammesAndStandardsTables1779600000000 implements MigrationInterface {
  name = 'CreateProgrammesAndStandardsTables1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "programme_status" AS ENUM ('draft', 'active', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TYPE "standard_status" AS ENUM ('draft', 'active', 'archived')`,
    );

    await queryRunner.query(
      `CREATE TABLE "programmes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "code" character varying(100) NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" "programme_status" NOT NULL DEFAULT 'draft',
        CONSTRAINT "PK_programmes" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "standards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "programmeId" uuid NOT NULL,
        "code" character varying(100) NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" "standard_status" NOT NULL DEFAULT 'draft',
        CONSTRAINT "PK_standards" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "programmes" ADD CONSTRAINT "FK_programmes_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "standards" ADD CONSTRAINT "FK_standards_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "standards" ADD CONSTRAINT "FK_standards_programmeId" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_programmes_active_org_code" ON "programmes" ("organisationId", "code") WHERE "isDeleted" = false`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_standards_active_org_code" ON "standards" ("organisationId", "code") WHERE "isDeleted" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_programmes_org_created" ON "programmes" ("organisationId", "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_standards_org_created" ON "standards" ("organisationId", "createdAt" DESC)`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(`
CREATE POLICY programmes_select ON programmes
  FOR SELECT
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY programmes_insert ON programmes
  FOR INSERT
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY programmes_update ON programmes
  FOR UPDATE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY programmes_delete ON programmes
  FOR DELETE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(`
CREATE POLICY standards_select ON standards
  FOR SELECT
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY standards_insert ON standards
  FOR INSERT
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY standards_update ON standards
  FOR UPDATE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
    await queryRunner.query(`
CREATE POLICY standards_delete ON standards
  FOR DELETE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(`ALTER TABLE programmes ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE programmes FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE standards ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE standards FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE standards NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`ALTER TABLE standards DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `ALTER TABLE programmes NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE programmes DISABLE ROW LEVEL SECURITY`,
    );

    await queryRunner.query(
      `DROP POLICY IF EXISTS standards_delete ON standards`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS standards_update ON standards`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS standards_insert ON standards`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS standards_select ON standards`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS programmes_delete ON programmes`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS programmes_update ON programmes`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS programmes_insert ON programmes`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS programmes_select ON programmes`,
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_standards_org_created"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_programmes_org_created"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_standards_active_org_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_programmes_active_org_code"`,
    );

    await queryRunner.query(`DROP TABLE "standards"`);
    await queryRunner.query(`DROP TABLE "programmes"`);
    await queryRunner.query(`DROP TYPE "standard_status"`);
    await queryRunner.query(`DROP TYPE "programme_status"`);
  }
}
