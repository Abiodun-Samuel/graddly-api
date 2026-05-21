import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateInvitationsTable1779263063906 implements MigrationInterface {
  name = 'CreateInvitationsTable1779263063906';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "email" character varying(320) NOT NULL,
        "role" "organisation_role" NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "organisationId" uuid NOT NULL,
        "invitedByUserId" uuid,
        CONSTRAINT "PK_invitations" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_invitedByUserId" FOREIGN KEY ("invitedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_invitations_active_org_email" ON "invitations" ("organisationId", lower("email")) WHERE "isDeleted" = false`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(`
CREATE POLICY invitations_select ON invitations
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR app_user_member_of_org("organisationId"::uuid)
  )`);

    await queryRunner.query(`
CREATE POLICY invitations_insert ON invitations
  FOR INSERT
  WITH CHECK (
    app_rls_bootstrap()
    OR (
      app_user_member_of_org("organisationId"::uuid)
      AND "invitedByUserId" = app_current_user()
    )
  )`);

    await queryRunner.query(`
CREATE POLICY invitations_update ON invitations
  FOR UPDATE
  USING ("organisationId" = app_current_org())
  WITH CHECK ("organisationId" = app_current_org())`);

    await queryRunner.query(`
CREATE POLICY invitations_delete ON invitations
  FOR DELETE
  USING ("organisationId" = app_current_org())`);

    await queryRunner.query(`
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE invitations FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE invitations NO FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `DROP POLICY IF EXISTS invitations_delete ON invitations`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS invitations_update ON invitations`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS invitations_insert ON invitations`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS invitations_select ON invitations`,
    );

    await queryRunner.query(`DROP TABLE "invitations"`);
  }
}
