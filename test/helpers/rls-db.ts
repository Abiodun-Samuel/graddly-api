import { Client } from 'pg';

/** Postgres superuser/migrator client for test assertions (bypasses RLS). */
export function createE2ePgClient(): Client {
  return new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_MIGRATION_USERNAME || 'postgres',
    password: process.env.DB_MIGRATION_PASSWORD ?? '',
    database: process.env.DB_NAME || 'graddly_test',
  });
}

export async function getUserIdByEmail(email: string): Promise<string> {
  const pg = createE2ePgClient();
  await pg.connect();
  try {
    const res = await pg.query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      [email],
    );
    const id = res.rows[0]?.id;
    if (!id) {
      throw new Error(`No user found for email ${email}`);
    }
    return id;
  } finally {
    await pg.end();
  }
}

export function createAppDbClient(): Client {
  return new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'graddly_app',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'graddly_test',
  });
}

export async function setTenantGucs(
  client: Client,
  userId: string,
  orgId: string,
): Promise<void> {
  await client.query(
    `SELECT set_config('app.current_user', $1, false),
            set_config('app.current_org', $2, false),
            set_config('app.rls_bootstrap', '0', false)`,
    [userId, orgId],
  );
}
