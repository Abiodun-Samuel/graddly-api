import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateCommitmentStatementsTables1780000000000 implements MigrationInterface {
  name = 'CreateCommitmentStatementsTables1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "commitment_statement_status" AS ENUM ('draft', 'submitted', 'awaiting_signatures', 'signed', 'superseded', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "commitment_signature_status" AS ENUM ('pending', 'signed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tripartite_party" AS ENUM ('apprentice', 'tutor', 'employer_manager')`,
    );

    await queryRunner.query(
      `CREATE TABLE "commitment_statement_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "enrolmentId" uuid NOT NULL,
        "apprenticeId" uuid NOT NULL,
        "currentVersionId" uuid,
        CONSTRAINT "PK_commitment_statement_groups" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "commitment_statement_groups" ADD CONSTRAINT "FK_commitment_groups_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commitment_statement_groups" ADD CONSTRAINT "FK_commitment_groups_enrolmentId" FOREIGN KEY ("enrolmentId") REFERENCES "enrolments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commitment_statement_groups" ADD CONSTRAINT "FK_commitment_groups_apprenticeId" FOREIGN KEY ("apprenticeId") REFERENCES "apprentices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_commitment_groups_active_org_enrolment" ON "commitment_statement_groups" ("organisationId", "enrolmentId") WHERE "isDeleted" = false`,
    );

    await queryRunner.query(
      `CREATE TABLE "commitment_statements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "organisationId" uuid NOT NULL,
        "groupId" uuid NOT NULL,
        "version" integer NOT NULL,
        "status" "commitment_statement_status" NOT NULL DEFAULT 'draft',
        "content" jsonb NOT NULL,
        "apprenticeUserId" uuid NOT NULL,
        "tutorUserId" uuid NOT NULL,
        "employerManagerUserId" uuid NOT NULL,
        "snapshotPdfJobId" uuid,
        "finalSignedPdfKey" character varying(1024),
        "publishedAt" TIMESTAMP WITH TIME ZONE,
        "publishedByUserId" uuid,
        "supersededAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_commitment_statements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_commitment_statements_group_version" UNIQUE ("groupId", "version")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "commitment_statements" ADD CONSTRAINT "FK_commitment_statements_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commitment_statements" ADD CONSTRAINT "FK_commitment_statements_groupId" FOREIGN KEY ("groupId") REFERENCES "commitment_statement_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commitment_statements_org_status" ON "commitment_statements" ("organisationId", "status")`,
    );

    await queryRunner.query(
      `ALTER TABLE "commitment_statement_groups" ADD CONSTRAINT "FK_commitment_groups_currentVersionId" FOREIGN KEY ("currentVersionId") REFERENCES "commitment_statements"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "commitment_signatures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "organisationId" uuid NOT NULL,
        "statementId" uuid NOT NULL,
        "party" "tripartite_party" NOT NULL,
        "signOrder" integer NOT NULL,
        "signerUserId" uuid NOT NULL,
        "status" "commitment_signature_status" NOT NULL DEFAULT 'pending',
        "signatureRecordId" uuid,
        CONSTRAINT "PK_commitment_signatures" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_commitment_signatures_statement_party" UNIQUE ("statementId", "party")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "commitment_signatures" ADD CONSTRAINT "FK_commitment_signatures_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commitment_signatures" ADD CONSTRAINT "FK_commitment_signatures_statementId" FOREIGN KEY ("statementId") REFERENCES "commitment_statements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commitment_signatures_org_statement" ON "commitment_signatures" ("organisationId", "statementId")`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    for (const table of [
      'commitment_statement_groups',
      'commitment_statements',
      'commitment_signatures',
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
      'commitment_signatures',
      'commitment_statements',
      'commitment_statement_groups',
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
    await queryRunner.query(`DROP TABLE "commitment_signatures"`);
    await queryRunner.query(
      `ALTER TABLE "commitment_statement_groups" DROP CONSTRAINT "FK_commitment_groups_currentVersionId"`,
    );
    await queryRunner.query(`DROP TABLE "commitment_statements"`);
    await queryRunner.query(`DROP TABLE "commitment_statement_groups"`);
    await queryRunner.query(`DROP TYPE "tripartite_party"`);
    await queryRunner.query(`DROP TYPE "commitment_signature_status"`);
    await queryRunner.query(`DROP TYPE "commitment_statement_status"`);
  }
}
