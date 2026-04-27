import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganisationMembershipsTable1777100000000 implements MigrationInterface {
  name = 'CreateOrganisationMembershipsTable1777100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "organisation_role" AS ENUM ('owner', 'admin', 'member')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organisation_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "role" "organisation_role" NOT NULL, "userId" uuid NOT NULL, "organisationId" uuid NOT NULL, CONSTRAINT "PK_organisation_memberships" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_memberships" ADD CONSTRAINT "FK_organisation_memberships_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organisation_memberships" ADD CONSTRAINT "FK_organisation_memberships_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_organisation_memberships_active_user_org" ON "organisation_memberships" ("userId", "organisationId") WHERE "isDeleted" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "organisation_memberships"`);
    await queryRunner.query(`DROP TYPE "organisation_role"`);
  }
}
