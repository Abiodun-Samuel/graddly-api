import path from 'path';

import { config } from 'dotenv';

import { resetEnvCache } from '../src/config/validate-env.js';

import { applyOidcE2eEnv } from './helpers/oidc-e2e-env.js';

config({ path: path.resolve(__dirname, '..', '.env.test') });

process.env.NODE_ENV = 'test';
process.env.TENANT_DB_CONTEXT_ENABLED = 'true';
process.env.THROTTLE_ENABLED = 'false';

applyOidcE2eEnv();
resetEnvCache();

// Clear AppModule cached by the default e2e project so OIDC routes register correctly.
jest.resetModules();

import '../src/database/postgres-query-runner.patch.js';
