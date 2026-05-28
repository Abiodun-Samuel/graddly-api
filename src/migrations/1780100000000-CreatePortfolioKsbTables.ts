import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreatePortfolioKsbTables1780100000000 implements MigrationInterface {
  name = 'CreatePortfolioKsbTables1780100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "ksb_kind" AS ENUM ('knowledge', 'skill', 'behaviour')`,
    );
    await queryRunner.query(
      `CREATE TYPE "ks_evidence_type" AS ENUM ('file', 'link', 'text')`,
    );
    await queryRunner.query(
      `CREATE TYPE "ks_evidence_status" AS ENUM ('draft', 'submitted', 'reviewed', 'accepted')`,
    );
    await queryRunner.query(
      `CREATE TYPE "ksb_coverage_assessment" AS ENUM ('sufficient', 'needs_more')`,
    );

    await queryRunner.query(
      `CREATE TABLE "ksb_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "standardId" uuid NOT NULL,
        "code" character varying(20) NOT NULL,
        "kind" "ksb_kind" NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "sortOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_ksb_definitions" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "ksb_definitions" ADD CONSTRAINT "FK_ksb_definitions_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ksb_definitions" ADD CONSTRAINT "FK_ksb_definitions_standardId" FOREIGN KEY ("standardId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_ksb_definitions_active_standard_code" ON "ksb_definitions" ("standardId", "code") WHERE "isDeleted" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ksb_definitions_org_standard" ON "ksb_definitions" ("organisationId", "standardId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "ks_evidence_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "enrolmentId" uuid NOT NULL,
        "apprenticeId" uuid NOT NULL,
        "type" "ks_evidence_type" NOT NULL,
        "title" character varying(255) NOT NULL,
        "body" text,
        "storageKey" character varying(1024),
        "externalUrl" character varying(2048),
        "status" "ks_evidence_status" NOT NULL DEFAULT 'draft',
        "submittedAt" TIMESTAMP WITH TIME ZONE,
        "submittedByUserId" uuid,
        "reviewedAt" TIMESTAMP WITH TIME ZONE,
        "reviewedByUserId" uuid,
        "acceptedAt" TIMESTAMP WITH TIME ZONE,
        "acceptedByUserId" uuid,
        "returnedAt" TIMESTAMP WITH TIME ZONE,
        "returnedByUserId" uuid,
        "returnReason" text,
        CONSTRAINT "PK_ks_evidence_items" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "ks_evidence_items" ADD CONSTRAINT "FK_ks_evidence_items_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ks_evidence_items" ADD CONSTRAINT "FK_ks_evidence_items_enrolmentId" FOREIGN KEY ("enrolmentId") REFERENCES "enrolments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ks_evidence_items" ADD CONSTRAINT "FK_ks_evidence_items_apprenticeId" FOREIGN KEY ("apprenticeId") REFERENCES "apprentices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ks_evidence_items_org_enrolment_status" ON "ks_evidence_items" ("organisationId", "enrolmentId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ks_evidence_items_org_apprentice" ON "ks_evidence_items" ("organisationId", "apprenticeId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "ks_evidence_ksb_mappings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "organisationId" uuid NOT NULL,
        "evidenceItemId" uuid NOT NULL,
        "ksbDefinitionId" uuid NOT NULL,
        CONSTRAINT "PK_ks_evidence_ksb_mappings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ks_evidence_ksb_mappings_item_ksb" UNIQUE ("evidenceItemId", "ksbDefinitionId")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "ks_evidence_ksb_mappings" ADD CONSTRAINT "FK_ks_evidence_ksb_mappings_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ks_evidence_ksb_mappings" ADD CONSTRAINT "FK_ks_evidence_ksb_mappings_evidenceItemId" FOREIGN KEY ("evidenceItemId") REFERENCES "ks_evidence_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ks_evidence_ksb_mappings" ADD CONSTRAINT "FK_ks_evidence_ksb_mappings_ksbDefinitionId" FOREIGN KEY ("ksbDefinitionId") REFERENCES "ksb_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "enrolment_ksb_coverage" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "organisationId" uuid NOT NULL,
        "enrolmentId" uuid NOT NULL,
        "ksbDefinitionId" uuid NOT NULL,
        "assessment" "ksb_coverage_assessment" NOT NULL,
        "assessedByUserId" uuid NOT NULL,
        "assessedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_enrolment_ksb_coverage" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_enrolment_ksb_coverage_enrolment_ksb" UNIQUE ("enrolmentId", "ksbDefinitionId")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolment_ksb_coverage" ADD CONSTRAINT "FK_enrolment_ksb_coverage_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolment_ksb_coverage" ADD CONSTRAINT "FK_enrolment_ksb_coverage_enrolmentId" FOREIGN KEY ("enrolmentId") REFERENCES "enrolments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrolment_ksb_coverage" ADD CONSTRAINT "FK_enrolment_ksb_coverage_ksbDefinitionId" FOREIGN KEY ("ksbDefinitionId") REFERENCES "ksb_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    for (const table of [
      'ksb_definitions',
      'ks_evidence_items',
      'ks_evidence_ksb_mappings',
      'enrolment_ksb_coverage',
    ] as const) {
      await queryRunner.query(`
CREATE POLICY ${table}_select ON ${table}
  FOR SELECT
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
      await queryRunner.query(`
CREATE POLICY ${table}_insert ON ${table}
  FOR INSERT
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
      await queryRunner.query(`
CREATE POLICY ${table}_update ON ${table}
  FOR UPDATE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
      await queryRunner.query(`
CREATE POLICY ${table}_delete ON ${table}
  FOR DELETE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);
      await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'enrolment_ksb_coverage',
      'ks_evidence_ksb_mappings',
      'ks_evidence_items',
      'ksb_definitions',
    ] as const) {
      await queryRunner.query(
        `ALTER TABLE ${table} NO FORCE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(
        `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_delete ON ${table}`,
      );
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_update ON ${table}`,
      );
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_insert ON ${table}`,
      );
      await queryRunner.query(
        `DROP POLICY IF EXISTS ${table}_select ON ${table}`,
      );
    }
    await queryRunner.query(`DROP TABLE "enrolment_ksb_coverage"`);
    await queryRunner.query(`DROP TABLE "ks_evidence_ksb_mappings"`);
    await queryRunner.query(`DROP TABLE "ks_evidence_items"`);
    await queryRunner.query(`DROP TABLE "ksb_definitions"`);
    await queryRunner.query(`DROP TYPE "ksb_coverage_assessment"`);
    await queryRunner.query(`DROP TYPE "ks_evidence_status"`);
    await queryRunner.query(`DROP TYPE "ks_evidence_type"`);
    await queryRunner.query(`DROP TYPE "ksb_kind"`);
  }
}
