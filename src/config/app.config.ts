import { registerAs } from '@nestjs/config';

import { getEnv } from './validate-env.js';

export default registerAs('app', () => {
  const e = getEnv();

  return {
    port: e.PORT,
    nodeEnv: e.NODE_ENV,
    swagger: {
      username: 'graddly',
      password: e.SWAGGER_PASSWORD || 'Gr4ddly!Sw4g@2026#Sec',
    },
    jwt: {
      secret: e.JWT_SECRET,
      accessExpiresIn: e.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: e.JWT_REFRESH_EXPIRES_IN,
    },
    throttle: {
      enabled: e.THROTTLE_ENABLED,
    },
    redis: {
      host: e.REDIS_HOST,
      port: e.REDIS_PORT,
    },
    loggly: {
      token: e.LOGGLY_TOKEN,
      subdomain: e.LOGGLY_SUBDOMAIN,
    },
    sentry: {
      dsn: e.SENTRY_DSN.trim(),
      environment: e.SENTRY_ENVIRONMENT || e.NODE_ENV,
      tracesSampleRate: e.SENTRY_TRACES_SAMPLE_RATE,
      profilesSampleRate: e.SENTRY_PROFILES_SAMPLE_RATE,
    },
  };
});
