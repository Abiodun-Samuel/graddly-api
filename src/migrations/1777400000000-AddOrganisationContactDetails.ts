import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganisationContactDetails1777400000000
  implements MigrationInterface
{
  name = 'AddOrganisationContactDetails1777400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "ukprn" character varying(8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "address" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "city" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "postcode" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "country" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "orgEmail" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "orgPhone" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "website" character varying(500)`,
    );
    // Partial unique index: allows multiple NULLs (pre-migration rows) while
    // enforcing uniqueness for any org that does carry a UKPRN.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_organisations_ukprn" ON "organisations" ("ukprn") WHERE "ukprn" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_organisations_ukprn"`);
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "website"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "orgPhone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "orgEmail"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "country"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "postcode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "city"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "address"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "ukprn"`,
    );
  }
}
