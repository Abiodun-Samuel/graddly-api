import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateSignatureRecordsTable1779500000001 implements MigrationInterface {
  name = 'CreateSignatureRecordsTable1779500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "signature_record_status" AS ENUM ('pending', 'signed', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "signature_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "organisationId" uuid NOT NULL,
        "signerUserId" uuid NOT NULL,
        "signatureImageKey" character varying(1024) NOT NULL,
        "signatureImageHash" character varying(64) NOT NULL,
        "signedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "clientIp" character varying(45) NOT NULL,
        "userAgent" text,
        "pdfGenerationJobId" uuid,
        "signedPdfKey" character varying(1024),
        "status" "signature_record_status" NOT NULL DEFAULT 'pending',
        CONSTRAINT "PK_signature_records" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "signature_records" ADD CONSTRAINT "FK_signature_records_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "signature_records" ADD CONSTRAINT "FK_signature_records_signerUserId" FOREIGN KEY ("signerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "signature_records" ADD CONSTRAINT "FK_signature_records_pdfGenerationJobId" FOREIGN KEY ("pdfGenerationJobId") REFERENCES "pdf_generation_jobs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_signature_records_org_created" ON "signature_records" ("organisationId", "createdAt" DESC)`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(`
CREATE POLICY signature_records_select ON signature_records
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )`);

    await queryRunner.query(`
CREATE POLICY signature_records_insert ON signature_records
  FOR INSERT
  WITH CHECK (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )`);

    await queryRunner.query(`
CREATE POLICY signature_records_update ON signature_records
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
ALTER TABLE signature_records ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE signature_records FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE signature_records NO FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
ALTER TABLE signature_records DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS signature_records_update ON signature_records`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS signature_records_insert ON signature_records`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS signature_records_select ON signature_records`,
    );
    await queryRunner.query(`DROP TABLE "signature_records"`);
    await queryRunner.query(`DROP TYPE "signature_record_status"`);
  }
}
