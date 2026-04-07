import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  swagger: {
    username: 'graddly',
    password: process.env.SWAGGER_PASSWORD || 'Gr4ddly!Sw4g@2026#Sec',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  throttle: {
    enabled: process.env.THROTTLE_ENABLED !== 'false',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  loggly: {
    token: process.env.LOGGLY_TOKEN || '',
    subdomain: process.env.LOGGLY_SUBDOMAIN || '',
  },
}));
