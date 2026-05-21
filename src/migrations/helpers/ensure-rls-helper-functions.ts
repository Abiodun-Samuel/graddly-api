import type { QueryRunner } from 'typeorm';

/**
 * Idempotent RLS session helpers (see EnableRowLevelSecurityOnPiiTables1777300000000).
 * Later migrations call this when a DB may have skipped the RLS migration (e.g. it was
 * added with an older timestamp after newer migrations already ran).
 */
export async function ensureRlsHelperFunctions(
  queryRunner: QueryRunner,
): Promise<void> {
  await queryRunner.query(`
CREATE OR REPLACE FUNCTION app_current_org()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_org', true), '')::uuid;
$$`);

  await queryRunner.query(`
CREATE OR REPLACE FUNCTION app_current_user()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user', true), '')::uuid;
$$`);

  await queryRunner.query(`
CREATE OR REPLACE FUNCTION app_rls_bootstrap()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('app.rls_bootstrap', true) = '1';
$$`);

  await queryRunner.query(`
CREATE OR REPLACE FUNCTION app_user_in_current_org(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organisation_memberships m
    WHERE m."userId" = p_user_id
      AND m."organisationId" = app_current_org()
      AND m."isDeleted" = false
  );
$$`);

  await queryRunner.query(`
CREATE OR REPLACE FUNCTION app_user_member_of_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organisation_memberships m
    WHERE m."organisationId" = p_org_id
      AND m."userId" = app_current_user()
      AND m."isDeleted" = false
  );
$$`);
}
