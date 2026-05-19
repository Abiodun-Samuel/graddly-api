import path from 'path';

import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '..', '.env.test') });

process.env.TENANT_DB_CONTEXT_ENABLED = 'true';

import '../src/database/postgres-query-runner.patch.js';
