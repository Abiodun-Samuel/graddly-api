import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationTypesReviewCommitment1780000000002 implements MigrationInterface {
  name = 'AddNotificationTypesReviewCommitment1780000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'review'`,
    );
    await queryRunner.query(
      `ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'commitment'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot drop individual enum values without recreating the type.
  }
}
