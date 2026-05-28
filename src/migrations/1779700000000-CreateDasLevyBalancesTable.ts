import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateDasLevyBalancesTable1779700000000 implements MigrationInterface {
  name = 'CreateDasLevyBalancesTable1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "das_sync_status" AS ENUM ('idle', 'success', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "das_levy_balances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "organisationId" uuid NOT NULL,
        "ukprn" character varying(8),
        "accountId" character varying(64),
        "balance" numeric(14,2),
        "currency" character varying(3),
        "lastSyncStatus" "das_sync_status" NOT NULL DEFAULT 'idle',
        "lastErrorMessage" text,
        "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
        "rawPayload" jsonb,
        CONSTRAINT "PK_das_levy_balances" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "das_levy_balances" ADD CONSTRAINT "FK_das_levy_balances_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_das_levy_balances_active_org" ON "das_levy_balances" ("organisationId") WHERE "isDeleted" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_das_levy_balances_org_created" ON "das_levy_balances" ("organisationId", "createdAt" DESC)`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(`
CREATE POLICY das_levy_balances_select ON das_levy_balances
  FOR SELECT
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(`
CREATE POLICY das_levy_balances_insert ON das_levy_balances
  FOR INSERT
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(`
CREATE POLICY das_levy_balances_update ON das_levy_balances
  FOR UPDATE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())
  WITH CHECK (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(`
CREATE POLICY das_levy_balances_delete ON das_levy_balances
  FOR DELETE
  USING (app_rls_bootstrap() OR "organisationId" = app_current_org())`);

    await queryRunner.query(
      `ALTER TABLE das_levy_balances ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE das_levy_balances FORCE ROW LEVEL SECURITY`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE das_levy_balances NO FORCE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(
      `ALTER TABLE das_levy_balances DISABLE ROW LEVEL SECURITY`,
    );

    await queryRunner.query(
      `DROP POLICY IF EXISTS das_levy_balances_delete ON das_levy_balances`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS das_levy_balances_update ON das_levy_balances`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS das_levy_balances_insert ON das_levy_balances`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS das_levy_balances_select ON das_levy_balances`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_das_levy_balances_org_created"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_das_levy_balances_active_org"`,
    );

    await queryRunner.query(`DROP TABLE "das_levy_balances"`);
    await queryRunner.query(`DROP TYPE "das_sync_status"`);
  }
}
