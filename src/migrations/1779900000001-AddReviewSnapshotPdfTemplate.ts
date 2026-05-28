import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewSnapshotPdfTemplate1779900000001 implements MigrationInterface {
  name = 'AddReviewSnapshotPdfTemplate1779900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "pdf_job_template" ADD VALUE IF NOT EXISTS 'review_snapshot'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot drop individual enum values without recreating the type.
  }
}
