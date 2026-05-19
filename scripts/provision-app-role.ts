/* eslint-disable no-console */
/**
 * Provisions the Postgres application role (subject to RLS, no BYPASSRLS).
 * Run as a superuser / migrator after schema migrations, before the API.
 *
 * Usage: yarn db:provision-role
 * See docs/database-setup.md
 */
import 'dotenv/config';

import { Client } from 'pg';

const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function requireIdentifier(name: string, value: string): string {
  if (!IDENTIFIER_RE.test(value)) {
    throw new Error(
      `${name} must be a valid Postgres identifier (got "${value}")`,
    );
  }
  return value;
}

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function main(): Promise<void> {
  const migratorUser = requireIdentifier(
    'DB_MIGRATION_USERNAME',
    process.env.DB_MIGRATION_USERNAME?.trim() || 'postgres',
  );
  const appRole = requireIdentifier('DB_USERNAME', requireEnv('DB_USERNAME'));
  const appPassword = requireEnv('DB_PASSWORD');
  const database = requireEnv('DB_NAME');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: migratorUser,
    password: process.env.DB_MIGRATION_PASSWORD ?? '',
    database,
  });

  await client.connect();

  try {
    const roleExists = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) AS exists`,
      [appRole],
    );

    if (!roleExists.rows[0]?.exists) {
      await client.query(
        `CREATE ROLE ${quoteIdent(appRole)} WITH LOGIN PASSWORD $1 NOSUPERUSER NOBYPASSRLS`,
        [appPassword],
      );
      console.log(`Created role "${appRole}".`);
    } else {
      await client.query(
        `ALTER ROLE ${quoteIdent(appRole)} WITH LOGIN PASSWORD $1 NOSUPERUSER NOBYPASSRLS`,
        [appPassword],
      );
      console.log(`Updated role "${appRole}" (password refreshed).`);
    }

    const role = quoteIdent(appRole);
    const db = quoteIdent(database);
    const migrator = quoteIdent(migratorUser);

    await client.query(`GRANT CONNECT ON DATABASE ${db} TO ${role}`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
    await client.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role}`,
    );
    await client.query(
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${role}`,
    );
    await client.query(`GRANT USAGE ON ALL TYPES IN SCHEMA public TO ${role}`);
    await client.query(
      `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${role}`,
    );
    await client.query(`
ALTER DEFAULT PRIVILEGES FOR ROLE ${migrator} IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${role}`);
    await client.query(`
ALTER DEFAULT PRIVILEGES FOR ROLE ${migrator} IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ${role}`);

    console.log(
      `Granted privileges to "${appRole}" on database "${database}".`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
