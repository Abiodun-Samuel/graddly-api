import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganisationPortalType1777600000000 implements MigrationInterface {
  name = 'AddOrganisationPortalType1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "portal_type" AS ENUM ('employer', 'apprentice', 'flow', 'provider')`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "portalType" "portal_type"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organisations_portalType" ON "organisations" ("portalType") WHERE "portalType" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_organisations_portalType"`);
    await queryRunner.query(
      `ALTER TABLE "organisations" DROP COLUMN "portalType"`,
    );
    await queryRunner.query(`DROP TYPE "portal_type"`);
  }
}
