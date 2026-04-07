import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  swagger: {
    username: 'graddly',
    password: process.env.SWAGGER_PASSWORD || 'Gr4ddly!Sw4g@2026#Sec',
  },
  loggly: {
    token: process.env.LOGGLY_TOKEN || '',
    subdomain: process.env.LOGGLY_SUBDOMAIN || '',
  },
}));
