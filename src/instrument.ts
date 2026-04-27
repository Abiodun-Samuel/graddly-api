import * as Sentry from '@sentry/nestjs';

import { getEnv } from './config/validate-env.js';

const env = getEnv();

const dsn = env.SENTRY_DSN.trim();

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
  tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  profilesSampleRate: env.SENTRY_PROFILES_SAMPLE_RATE,
});
