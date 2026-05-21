import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserOidcIdentities1777400000000 implements MigrationInterface {
  name = 'CreateUserOidcIdentities1777400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_oidc_identities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "userId" uuid NOT NULL,
        "issuer" character varying(512) NOT NULL,
        "subject" character varying(255) NOT NULL,
        "linkedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_oidc_identities" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "user_oidc_identities" ADD CONSTRAINT "FK_user_oidc_identities_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_oidc_identities_issuer_subject" ON "user_oidc_identities" ("issuer", "subject")`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_oidc_identities_user_issuer" ON "user_oidc_identities" ("userId", "issuer")`,
    );

    await queryRunner.query(`
CREATE POLICY user_oidc_identities_select ON user_oidc_identities
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
CREATE POLICY user_oidc_identities_insert ON user_oidc_identities
  FOR INSERT
  WITH CHECK (app_rls_bootstrap())`);

    await queryRunner.query(`
ALTER TABLE user_oidc_identities ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE user_oidc_identities FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP POLICY IF EXISTS users_update ON users`);

    await queryRunner.query(`
CREATE POLICY users_update ON users
  FOR UPDATE
  USING (
    app_rls_bootstrap()
    OR id = app_current_user()
    OR app_user_in_current_org(id)
  )
  WITH CHECK (
    app_rls_bootstrap()
    OR id = app_current_user()
    OR app_user_in_current_org(id)
  )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS users_update ON users`);

    await queryRunner.query(`
CREATE POLICY users_update ON users
  FOR UPDATE
  USING (
    id = app_current_user()
    OR app_user_in_current_org(id)
  )
  WITH CHECK (
    id = app_current_user()
    OR app_user_in_current_org(id)
  )`);

    await queryRunner.query(`
ALTER TABLE user_oidc_identities NO FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE user_oidc_identities DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(
      `DROP POLICY IF EXISTS user_oidc_identities_insert ON user_oidc_identities`,
    );

    await queryRunner.query(
      `DROP POLICY IF EXISTS user_oidc_identities_select ON user_oidc_identities`,
    );

    await queryRunner.query(`DROP TABLE "user_oidc_identities"`);
  }
}
