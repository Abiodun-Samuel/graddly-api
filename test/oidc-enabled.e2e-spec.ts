import { INestApplication } from '@nestjs/common';
import { Client } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';

import {
  parseEnvFromProcess,
  resetEnvCache,
} from '../src/config/validate-env.js';

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
import { applyOidcE2eEnv } from './helpers/oidc-e2e-env.js';

const E2E_OIDC_ISSUER = 'https://oidc.test.example';

function createE2ePgClient(): Client {
  return new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_MIGRATION_USERNAME || 'postgres',
    password: process.env.DB_MIGRATION_PASSWORD ?? '',
    database: process.env.DB_NAME || 'graddly_test',
  });
}

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

      const pg = createE2ePgClient();
      await pg.connect();
      const identity = await pg.query<{ userId: string; subject: string }>(
        `SELECT "userId", subject FROM user_oidc_identities WHERE issuer = $1 AND subject = $2`,
        [E2E_OIDC_ISSUER, 'one-login-sub-1'],
      );
      await pg.end();

      expect(identity.rows).toHaveLength(1);
    });

    it('returns tokens on repeat login by sub', async () => {
      const sub = 'one-login-sub-repeat';
      const email = `oidc-repeat-${Date.now()}@example.com`;

      setOidcE2eClaims({ email, emailVerified: true, sub });

      const agent = request.agent(app.getHttpServer());
      await agent.get('/api/v1/auth/oidc/login').expect(302);
      await agent
        .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
        .expect(200);

      const res = await agent
        .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
        .expect(200);

      expectSuccessEnvelope(res.body);
      expect(res.body.data).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });
  });

  it('GET /auth/oidc/callback auto-provisions a new user when email is unknown', async () => {
    const email = `oidc-provision-${Date.now()}@example.com`;
    const sub = `sub-provision-${Date.now()}`;

    setOidcE2eClaims({ email, emailVerified: true, sub });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
      .expect(200);

    expectSuccessEnvelope(res.body);

    const pg = createE2ePgClient();
    await pg.connect();
    const user = await pg.query<{ id: string; isEmailVerified: boolean }>(
      `SELECT id, "isEmailVerified" FROM users WHERE email = $1`,
      [email],
    );
    const identity = await pg.query(
      `SELECT 1 FROM user_oidc_identities WHERE issuer = $1 AND subject = $2`,
      [E2E_OIDC_ISSUER, sub],
    );
    await pg.end();

    expect(user.rows).toHaveLength(1);
    expect(user.rows[0].isEmailVerified).toBe(true);
    expect(identity.rows).toHaveLength(1);
  });

  it('GET /auth/oidc/callback returns 403 when sub is linked to a different email', async () => {
    const emailA = `oidc-conflict-a-${Date.now()}@example.com`;
    const emailB = `oidc-conflict-b-${Date.now()}@example.com`;
    const sub = `sub-conflict-${Date.now()}`;

    await signupUser(app, {
      firstName: 'Conflict',
      lastName: 'A',
      email: emailA,
      password: 'P@ssw0rd!',
    });

    setOidcE2eClaims({ email: emailB, emailVerified: true, sub });
    const agent = request.agent(app.getHttpServer());
    await agent.get('/api/v1/auth/oidc/login').expect(302);
    await agent
      .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
      .expect(200);

    setOidcE2eClaims({ email: emailA, emailVerified: true, sub });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/oidc/callback?code=e2e-auth-code&state=e2e-state')
      .expect(403);

    expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
      statusCode: 403,
      message: 'One Login identity does not match the linked account email',
      path: /^\/api\/v1\/auth\/oidc\/callback/u,
      error: 'Forbidden',
    });
  });

  describe('link_existing provisioning mode', () => {
    let linkExistingApp: INestApplication<App>;

    beforeAll(async () => {
      process.env.OIDC_PROVISIONING_MODE = 'link_existing';
      resetEnvCache();
      parseEnvFromProcess();
      linkExistingApp = await createE2eApp({ requireOidc: true });
    });

    afterAll(async () => {
      await linkExistingApp?.close();
      applyOidcE2eEnv();
      resetEnvCache();
      parseEnvFromProcess();
    });

    it('GET /auth/oidc/callback returns 403 when no linked account exists', async () => {
      setOidcE2eClaims({
        email: `oidc-unlinked-${Date.now()}@example.com`,
        emailVerified: true,
      });

      const res = await request(linkExistingApp.getHttpServer())
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

    const pg = createE2ePgClient();
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
