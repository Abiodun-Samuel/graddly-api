import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateReviewsTables1779900000000 implements MigrationInterface {
  name = 'CreateReviewsTables1779900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "review_status" AS ENUM ('scheduled', 'in_progress', 'awaiting_signatures', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "review_signer_party" AS ENUM ('apprentice', 'tutor', 'employer_manager')`,
    );
    await queryRunner.query(
      `CREATE TYPE "review_signature_status" AS ENUM ('pending', 'signed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "review_reminder_kind" AS ENUM ('7d', '1d')`,
    );

    await queryRunner.query(
      `CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "enrolmentId" uuid NOT NULL,
        "apprenticeId" uuid NOT NULL,
        "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "title" character varying(200),
        "reviewType" character varying(50),
        "status" "review_status" NOT NULL DEFAULT 'scheduled',
        "isOverdue" boolean NOT NULL DEFAULT false,
        "overdueSince" date,
        "apprenticeUserId" uuid NOT NULL,
        "tutorUserId" uuid NOT NULL,
        "employerManagerUserId" uuid NOT NULL,
        "snapshotPdfJobId" uuid,
        "finalSignedPdfKey" character varying(1024),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_enrolmentId" FOREIGN KEY ("enrolmentId") REFERENCES "enrolments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_apprenticeId" FOREIGN KEY ("apprenticeId") REFERENCES "apprentices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_org_scheduled_at" ON "reviews" ("organisationId", "scheduledAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_org_status_scheduled_at" ON "reviews" ("organisationId", "status", "scheduledAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_org_apprentice_scheduled_at" ON "reviews" ("organisationId", "apprenticeId", "scheduledAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_org_enrolment_scheduled_at" ON "reviews" ("organisationId", "enrolmentId", "scheduledAt")`,
    );

    await queryRunner.query(
      `CREATE TABLE "review_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "organisationId" uuid NOT NULL,
        "reviewId" uuid NOT NULL,
        "payload" jsonb NOT NULL,
        "submittedAt" TIMESTAMP WITH TIME ZONE,
        "submittedByUserId" uuid,
        CONSTRAINT "PK_review_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_records_reviewId" UNIQUE ("reviewId")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_records" ADD CONSTRAINT "FK_review_records_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_records" ADD CONSTRAINT "FK_review_records_reviewId" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_review_records_org_review" ON "review_records" ("organisationId", "reviewId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "review_signatures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "organisationId" uuid NOT NULL,
        "reviewId" uuid NOT NULL,
        "party" "review_signer_party" NOT NULL,
        "signOrder" integer NOT NULL,
        "signerUserId" uuid NOT NULL,
        "status" "review_signature_status" NOT NULL DEFAULT 'pending',
        "signatureRecordId" uuid,
        CONSTRAINT "PK_review_signatures" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_signatures_review_party" UNIQUE ("reviewId", "party")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_signatures" ADD CONSTRAINT "FK_review_signatures_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_signatures" ADD CONSTRAINT "FK_review_signatures_reviewId" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_review_signatures_org_review" ON "review_signatures" ("organisationId", "reviewId")`,
    );

    await queryRunner.query(
      `CREATE TABLE "review_reminder_dispatches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "reviewId" uuid NOT NULL,
        "reminderKind" "review_reminder_kind" NOT NULL,
        "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_reminder_dispatches" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_reminder_dispatches_review_kind" UNIQUE ("reviewId", "reminderKind")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "review_reminder_dispatches" ADD CONSTRAINT "FK_review_reminder_dispatches_reviewId" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "signature_records" ADD "sourcePdfKey" character varying(1024)`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    for (const table of [
      'reviews',
      'review_records',
      'review_signatures',
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
    await queryRunner.query(
      `ALTER TABLE "signature_records" DROP COLUMN "sourcePdfKey"`,
    );
    await queryRunner.query(`DROP TABLE "review_reminder_dispatches"`);
    for (const table of [
      'review_signatures',
      'review_records',
      'reviews',
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
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
    await queryRunner.query(`DROP TYPE "review_reminder_kind"`);
    await queryRunner.query(`DROP TYPE "review_signature_status"`);
    await queryRunner.query(`DROP TYPE "review_signer_party"`);
    await queryRunner.query(`DROP TYPE "review_status"`);
  }
}
