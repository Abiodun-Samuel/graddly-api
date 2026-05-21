import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Accept flow soft-deletes an invitation before the user is an org member.
 * `app_current_org()` may not match the invite org; allow updates under RLS bootstrap
 * (service still validates token + email + expiry).
 */
export class InvitationsUpdateAllowRlsBootstrap1779263063907 implements MigrationInterface {
  name = 'InvitationsUpdateAllowRlsBootstrap1779263063907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS invitations_update ON invitations`,
    );
    await queryRunner.query(`
CREATE POLICY invitations_update ON invitations
  FOR UPDATE
  USING (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )
  WITH CHECK (
    app_rls_bootstrap()
    OR "organisationId" = app_current_org()
  )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS invitations_update ON invitations`,
    );
    await queryRunner.query(`
CREATE POLICY invitations_update ON invitations
  FOR UPDATE
  USING ("organisationId" = app_current_org())
  WITH CHECK ("organisationId" = app_current_org())`);
  }
}
