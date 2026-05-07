import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Session GUC for optional Postgres RLS (Phase C / ADR 0001). The API also sets
 * `app.current_org` via `set_config` before each ORM query when tenant DB context
 * is enabled so pooled connections do not carry stale tenant state.
 */
export class AppSetCurrentOrgSessionVar1777200000000 implements MigrationInterface {
  name = 'AppSetCurrentOrgSessionVar1777200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
CREATE OR REPLACE FUNCTION app_set_current_org(org_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.current_org', org_id::text, false);
END;
$$`);

    await queryRunner.query(`
COMMENT ON FUNCTION app_set_current_org(uuid) IS
  'Sets session GUC app.current_org (text UUID) for RLS. Invoked from SQL or manually; the API also sets this via set_config before each ORM query when tenant DB context is enabled.'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS app_set_current_org(uuid)`,
    );
  }
}
