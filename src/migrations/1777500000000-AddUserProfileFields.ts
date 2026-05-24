import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1777500000000 implements MigrationInterface {
  name = 'AddUserProfileFields1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_gender" AS ENUM ('male', 'female', 'non-binary', 'prefer-not-to-say')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "title" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone" character varying(20)`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "dateOfBirth" date`);
    await queryRunner.query(`ALTER TABLE "users" ADD "gender" "user_gender"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "jobTitle" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "department" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "locale" character varying(10) NOT NULL DEFAULT 'en-GB'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "timezone" character varying(50) NOT NULL DEFAULT 'Europe/London'`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "timezone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locale"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "department"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "jobTitle"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "dateOfBirth"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "title"`);
    await queryRunner.query(`DROP TYPE "user_gender"`);
  }
}
