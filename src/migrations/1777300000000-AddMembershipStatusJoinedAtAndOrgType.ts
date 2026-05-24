import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembershipStatusJoinedAtAndOrgType1777300000000 implements MigrationInterface {
  name = 'AddMembershipStatusJoinedAtAndOrgType1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "membership_status" AS ENUM ('active', 'pending', 'revoked')`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_memberships" ADD "status" "membership_status" NOT NULL DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_memberships" ADD "joinedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisations" ADD "type" character varying(100)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organisation_memberships_userId" ON "organisation_memberships" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_organisation_memberships_userId"`);
    await queryRunner.query(`ALTER TABLE "organisations" DROP COLUMN "type"`);
    await queryRunner.query(
      `ALTER TABLE "organisation_memberships" DROP COLUMN "joinedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_memberships" DROP COLUMN "status"`,
    );
    await queryRunner.query(`DROP TYPE "membership_status"`);
  }
}
