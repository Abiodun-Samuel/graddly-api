import { INestApplication } from '@nestjs/common';
import { Client } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';

import { createE2eApp } from './helpers/e2e-app.js';
import { signupUser } from './helpers/e2e-http.js';
import {
  expectFilteredHttpExceptionBody,
  expectSuccessEnvelope,
} from './helpers/e2e-response-contracts.js';
import {
  resetOidcE2eClaims,
  setOidcE2eAuthFail,
  setOidcE2eClaims,
} from './helpers/oidc-e2e-claims.js';

describe('OIDC routes (e2e, enabled)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp({ requireOidc: true });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetOidcE2eClaims();
  });

  it('GET /auth/oidc/login redirects to the callback with an authorization code', async () => {
    const agent = request.agent(app.getHttpServer());

    const loginRes = await agent.get('/api/v1/auth/oidc/login').expect(302);

    expect(loginRes.headers.location).toMatch(
      /\/api\/v1\/auth\/oidc\/callback\?code=e2e-auth-code/u,
    );
  });

  describe('GET /auth/oidc/callback', () => {
    let linkedEmail: string;

    beforeAll(async () => {
      linkedEmail = `oidc-linked-${Date.now()}@example.com`;
      await signupUser(app, {
        firstName: 'Oidc',
        lastName: 'User',
        email: linkedEmail,
        password: 'P@ssw0rd!',
      });
    });

    it('returns tokens for a linked verified user', async () => {
      setOidcE2eClaims({
        email: linkedEmail,
        emailVerified: true,
        sub: 'one-login-sub-1',
      });

      const agent = request.agent(app.getHttpServer());
      await agent.get('/api/v1/auth/oidc/login').expect(302);

      const res = await agent
        .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
        .expect(200);

      expectSuccessEnvelope(res.body);
      expect(res.body.message).toBe('Logged in successfully');
      expect(res.body.data).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });
  });

  it('GET /auth/oidc/callback returns 403 when no linked account exists', async () => {
    setOidcE2eClaims({
      email: `oidc-unlinked-${Date.now()}@example.com`,
      emailVerified: true,
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
      .expect(403);

    expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
      statusCode: 403,
      message:
        'No linked account for this One Login identity. Contact your administrator or sign up with email and password.',
      path: /^\/api\/v1\/auth\/oidc\/callback/u,
      error: 'Forbidden',
    });
  });

  it('GET /auth/oidc/callback returns 403 when email is not verified', async () => {
    const email = `oidc-unverified-${Date.now()}@example.com`;

    await signupUser(app, {
      firstName: 'Oidc',
      lastName: 'Unverified',
      email,
      password: 'P@ssw0rd!',
    });

    setOidcE2eClaims({ email, emailVerified: false });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
      .expect(403);

    expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
      statusCode: 403,
      message: 'One Login email address is not verified for this account',
      path: /^\/api\/v1\/auth\/oidc\/callback/u,
      error: 'Forbidden',
    });
  });

  it('GET /auth/oidc/callback returns 401 when the account is deactivated', async () => {
    const email = `oidc-inactive-${Date.now()}@example.com`;

    await signupUser(app, {
      firstName: 'Oidc',
      lastName: 'Inactive',
      email,
      password: 'P@ssw0rd!',
    });

    const pg = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_MIGRATION_USERNAME || 'postgres',
      password: process.env.DB_MIGRATION_PASSWORD ?? '',
      database: process.env.DB_NAME || 'graddly_test',
    });
    await pg.connect();
    await pg.query(`UPDATE users SET "isActive" = false WHERE email = $1`, [
      email,
    ]);
    await pg.end();

    setOidcE2eClaims({ email, emailVerified: true });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
      .expect(401);

    expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
      statusCode: 401,
      message: 'Account is deactivated',
      path: /^\/api\/v1\/auth\/oidc\/callback/u,
      error: 'Unauthorized',
    });
  });

  it('GET /auth/oidc/callback returns 401 when One Login authentication fails', async () => {
    setOidcE2eAuthFail(true);

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
      .expect(401);

    expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
      statusCode: 401,
      message: 'Mock IdP rejected credentials',
      path: /^\/api\/v1\/auth\/oidc\/callback/u,
      error: 'Unauthorized',
    });
  });
});
