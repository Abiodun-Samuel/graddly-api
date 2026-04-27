import { envSchema, type Env } from './env.schema.js';

import type { ZodError } from 'zod';

let cached: Env | undefined;

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${formatZodError(result.error)}`,
    );
  }
  return result.data;
}

/** Parse and cache from the given env record (used by Nest ConfigModule.validate). */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  cached = parseEnv(config);
  return config;
}

/** Parse `process.env` and cache (CLI / bootstrap before Nest). */
export function parseEnvFromProcess(): Env {
  cached = parseEnv(process.env as Record<string, unknown>);
  return cached;
}

export function getEnv(): Env {
  if (cached === undefined) {
    return parseEnvFromProcess();
  }
  return cached;
}
