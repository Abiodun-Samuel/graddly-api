import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationTypePortfolio1780100000001 implements MigrationInterface {
  name = 'AddNotificationTypePortfolio1780100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'portfolio'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot drop individual enum values without recreating the type.
  }
}
