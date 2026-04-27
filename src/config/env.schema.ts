/* eslint-disable @typescript-eslint/naming-convention -- keys mirror process.env (UPPER_SNAKE_CASE) */

import { z } from 'zod';

const NODE_ENVS = ['development', 'test', 'production', 'staging'] as const;

/** Raw process env: strings or undefined (Nest passes a plain record). */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVS).default('development'),

    PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    DB_HOST: z.string().min(1).default('localhost'),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
    DB_USERNAME: z.string().min(1).default('graddly'),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().min(1).default('graddly'),

    JWT_SECRET: z.string().default('change-me-in-production'),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),

    REDIS_HOST: z.string().min(1).default('localhost'),
    REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),

    THROTTLE_ENABLED: z
      .string()
      .optional()
      .default('true')
      .transform((v) => v !== 'false'),

    SWAGGER_PASSWORD: z.string().optional().default(''),
    LOGGLY_TOKEN: z.string().optional().default(''),
    LOGGLY_SUBDOMAIN: z.string().optional().default(''),

    SENTRY_DSN: z.string().optional().default(''),
    SENTRY_ENVIRONMENT: z.string().optional().default(''),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
    SENTRY_PROFILES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  })
  .superRefine((data, ctx) => {
    const deployed =
      data.NODE_ENV === 'production' || data.NODE_ENV === 'staging';

    if (!deployed) {
      return;
    }

    const weakJwt =
      !data.JWT_SECRET ||
      data.JWT_SECRET.length < 32 ||
      data.JWT_SECRET === 'change-me-in-production';

    if (weakJwt) {
      ctx.addIssue({
        code: 'custom',
        message:
          'JWT_SECRET must be set to a strong secret (min 32 characters) and must not use the development default when NODE_ENV is production or staging.',
        path: ['JWT_SECRET'],
      });
    }

    if (!data.SWAGGER_PASSWORD || data.SWAGGER_PASSWORD.length < 12) {
      ctx.addIssue({
        code: 'custom',
        message:
          'SWAGGER_PASSWORD must be set (min 12 characters) when NODE_ENV is production or staging.',
        path: ['SWAGGER_PASSWORD'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
