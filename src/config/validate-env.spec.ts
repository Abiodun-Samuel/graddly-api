/* eslint-disable @typescript-eslint/naming-convention -- fixtures mirror process.env */

import { parseEnv } from './validate-env.js';

describe('parseEnv', () => {
  it('accepts a minimal development-shaped env', () => {
    const env = parseEnv({
      NODE_ENV: 'development',
      JWT_SECRET: 'change-me-in-production',
    });

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.THROTTLE_ENABLED).toBe(true);
  });

  it('rejects production with a short JWT secret', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'too-short',
        SWAGGER_PASSWORD: 'twelvechars12',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects production without Swagger password', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'x'.repeat(32),
        SWAGGER_PASSWORD: '',
      }),
    ).toThrow(/SWAGGER_PASSWORD/);
  });

  it('accepts production with strong secrets', () => {
    const env = parseEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(32),
      SWAGGER_PASSWORD: 'strong-pass-12',
    });

    expect(env.NODE_ENV).toBe('production');
  });
});
