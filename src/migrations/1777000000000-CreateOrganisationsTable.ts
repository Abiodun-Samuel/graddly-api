import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganisationsTable1777000000000 implements MigrationInterface {
  name = 'CreateOrganisationsTable1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isDeleted" boolean NOT NULL DEFAULT false, "deletedAt" TIMESTAMP, "name" character varying(255) NOT NULL, "slug" character varying(100) NOT NULL, CONSTRAINT "UQ_organisations_slug" UNIQUE ("slug"), CONSTRAINT "PK_organisations" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "organisations"`);
  }
}
