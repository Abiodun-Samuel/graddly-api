import { Client } from 'pg';

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
