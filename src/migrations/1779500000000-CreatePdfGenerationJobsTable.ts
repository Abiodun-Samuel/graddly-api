import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreatePdfGenerationJobsTable1779500000000 implements MigrationInterface {
  name = 'CreatePdfGenerationJobsTable1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "pdf_job_template" AS ENUM ('hello')`);
    await queryRunner.query(
      `CREATE TYPE "pdf_job_status" AS ENUM ('queued', 'processing', 'completed', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "pdf_generation_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "organisationId" uuid NOT NULL,
        "requestedByUserId" uuid NOT NULL,
        "template" "pdf_job_template" NOT NULL,
        "status" "pdf_job_status" NOT NULL DEFAULT 'queued',
        "outputKey" character varying(1024),
        "errorMessage" text,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_pdf_generation_jobs" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "pdf_generation_jobs" ADD CONSTRAINT "FK_pdf_generation_jobs_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pdf_generation_jobs" ADD CONSTRAINT "FK_pdf_generation_jobs_requestedByUserId" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_pdf_jobs_org_created" ON "pdf_generation_jobs" ("organisationId", "createdAt" DESC)`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(`
CREATE POLICY pdf_generation_jobs_select ON pdf_generation_jobs
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )`);

    await queryRunner.query(`
CREATE POLICY pdf_generation_jobs_insert ON pdf_generation_jobs
  FOR INSERT
  WITH CHECK (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )`);

    await queryRunner.query(`
CREATE POLICY pdf_generation_jobs_update ON pdf_generation_jobs
  FOR UPDATE
  USING (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )
  WITH CHECK (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )`);

    await queryRunner.query(`
ALTER TABLE pdf_generation_jobs ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE pdf_generation_jobs FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE pdf_generation_jobs NO FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
ALTER TABLE pdf_generation_jobs DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS pdf_generation_jobs_update ON pdf_generation_jobs`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS pdf_generation_jobs_insert ON pdf_generation_jobs`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS pdf_generation_jobs_select ON pdf_generation_jobs`,
    );
    await queryRunner.query(`DROP TABLE "pdf_generation_jobs"`);
    await queryRunner.query(`DROP TYPE "pdf_job_status"`);
    await queryRunner.query(`DROP TYPE "pdf_job_template"`);
  }
}
