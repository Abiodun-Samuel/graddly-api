import { MigrationInterface, QueryRunner } from 'typeorm';

import { ensureRlsHelperFunctions } from './helpers/ensure-rls-helper-functions.js';

export class CreateNotificationsTables1779300000000 implements MigrationInterface {
  name = 'CreateNotificationsTables1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "notification_type" AS ENUM ('system', 'generic', 'invitation', 'otj')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notification_channel" AS ENUM ('in_app', 'email', 'digest')`,
    );

    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "userId" uuid NOT NULL,
        "organisationId" uuid,
        "type" "notification_type" NOT NULL,
        "title" character varying(200) NOT NULL,
        "body" text NOT NULL,
        "readAt" TIMESTAMP WITH TIME ZONE,
        "metadata" jsonb,
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_read_created" ON "notifications" ("userId", "readAt", "createdAt" DESC) WHERE "isDeleted" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_org" ON "notifications" ("userId", "organisationId") WHERE "isDeleted" = false`,
    );

    await queryRunner.query(
      `CREATE TABLE "notification_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "userId" uuid NOT NULL,
        "organisationId" uuid,
        "channel" "notification_channel" NOT NULL,
        "type" "notification_type" NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_notification_preferences_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_notification_preferences_organisationId" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_notification_preferences_active" ON "notification_preferences" ("userId", "organisationId", "channel", "type") WHERE "isDeleted" = false`,
    );

    await ensureRlsHelperFunctions(queryRunner);

    await queryRunner.query(`
CREATE POLICY notifications_select ON notifications
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
CREATE POLICY notifications_insert ON notifications
  FOR INSERT
  WITH CHECK (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
CREATE POLICY notifications_update ON notifications
  FOR UPDATE
  USING (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )
  WITH CHECK (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
CREATE POLICY notifications_delete ON notifications
  FOR DELETE
  USING (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE notifications FORCE ROW LEVEL SECURITY`);

    await queryRunner.query(`
CREATE POLICY notification_preferences_select ON notification_preferences
  FOR SELECT
  USING (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
CREATE POLICY notification_preferences_insert ON notification_preferences
  FOR INSERT
  WITH CHECK (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
CREATE POLICY notification_preferences_update ON notification_preferences
  FOR UPDATE
  USING (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )
  WITH CHECK (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
CREATE POLICY notification_preferences_delete ON notification_preferences
  FOR DELETE
  USING (
    app_rls_bootstrap()
    OR "userId" = app_current_user()
  )`);

    await queryRunner.query(`
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
ALTER TABLE notification_preferences FORCE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
ALTER TABLE notification_preferences NO FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS notification_preferences_delete ON notification_preferences`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS notification_preferences_update ON notification_preferences`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS notification_preferences_insert ON notification_preferences`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS notification_preferences_select ON notification_preferences`,
    );

    await queryRunner.query(`
ALTER TABLE notifications NO FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `DROP POLICY IF EXISTS notifications_delete ON notifications`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS notifications_update ON notifications`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS notifications_insert ON notifications`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS notifications_select ON notifications`,
    );

    await queryRunner.query(`DROP TABLE "notification_preferences"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_channel"`);
    await queryRunner.query(`DROP TYPE "notification_type"`);
  }
}
