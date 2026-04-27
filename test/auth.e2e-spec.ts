import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import {
  expectFilteredHttpExceptionBody,
  expectValidationErrorBody,
} from './helpers/e2e-response-contracts.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const signupDto = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    password: 'P@ssw0rd!',
  };

  let accessToken: string;
  let refreshToken: string;

  describe('POST /auth/signup', () => {
    it('should return 201 with { message, data: { accessToken, refreshToken } }', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signupDto)
        .expect(201);

      expect(res.body).toEqual({
        message: 'Account created successfully',
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });
    });

    it('should return 409 when email is already in use', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signupDto)
        .expect(409);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 409,
        message: 'Email already in use',
        path: '/api/v1/auth/signup',
        error: 'Conflict',
      });
    });

    it('should return 422 for invalid payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ email: 'not-valid' })
        .expect(422);

      expectValidationErrorBody(
        res.body as Record<string, unknown>,
        '/api/v1/auth/signup',
      );
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 with { message, data: { accessToken, refreshToken } }', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: signupDto.email, password: signupDto.password })
        .expect(200);

      expect(res.body).toEqual({
        message: 'Logged in successfully',
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      accessToken = res.body.data.accessToken as string;
      refreshToken = res.body.data.refreshToken as string;
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: signupDto.email, password: 'WrongPassword!' })
        .expect(401);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 401,
        message: 'Invalid credentials',
        path: '/api/v1/auth/login',
        error: 'Unauthorized',
      });
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@example.com', password: 'P@ssw0rd!' })
        .expect(401);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 401,
        message: 'Invalid credentials',
        path: '/api/v1/auth/login',
        error: 'Unauthorized',
      });
    });
  });

  describe('GET /auth/me', () => {
    it('should return 200 with { message, data: user } for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual({
        message: 'User profile retrieved',
        data: {
          id: expect.any(String),
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          email: signupDto.email,
          isEmailVerified: false,
          isActive: true,
          avatarUrl: null,
          isDeleted: false,
          deletedAt: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should return 401 without a token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 401,
        message: 'Unauthorized',
        path: '/api/v1/auth/me',
      });
    });

    it('should return 401 with an invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 401,
        message: 'Unauthorized',
        path: '/api/v1/auth/me',
      });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 200 with new token pair', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toEqual({
        message: 'Token refreshed successfully',
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      accessToken = res.body.data.accessToken as string;
      refreshToken = res.body.data.refreshToken as string;
    });

    it('should return 401 when reusing an already-rotated refresh token', async () => {
      const staleToken = refreshToken;

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: staleToken })
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: staleToken })
        .expect(401);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 401,
        message: 'Invalid or expired refresh token',
        path: '/api/v1/auth/refresh',
        error: 'Unauthorized',
      });
    });
  });

  describe('POST /auth/logout', () => {
    let logoutAccessToken: string;
    let logoutRefreshToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: signupDto.email, password: signupDto.password });

      logoutAccessToken = res.body.data.accessToken as string;
      logoutRefreshToken = res.body.data.refreshToken as string;
    });

    it('should return 204 and invalidate the refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${logoutAccessToken}`)
        .send({ refreshToken: logoutRefreshToken })
        .expect(204);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: logoutRefreshToken })
        .expect(401);
    });

    it('should return 401 without a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'anything' })
        .expect(401);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 401,
        message: 'Unauthorized',
        path: '/api/v1/auth/logout',
      });
    });
  });

  describe('GET /auth/active-organisation', () => {
    let ctxToken: string;
    let ctxRefreshToken: string;
    let userId: string;

    beforeAll(async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: signupDto.email, password: signupDto.password })
        .expect(200);
      ctxToken = login.body.data.accessToken as string;
      ctxRefreshToken = login.body.data.refreshToken as string;
      const payload = JSON.parse(
        Buffer.from(ctxToken.split('.')[1], 'base64url').toString('utf8'),
      ) as { sub: string };
      userId = payload.sub;
    });

    it('returns 403 when user has no organisation context', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/active-organisation')
        .set('Authorization', `Bearer ${ctxToken}`)
        .expect(403);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 403,
        message: 'No active organisation context',
        path: '/api/v1/auth/active-organisation',
        error: 'Forbidden',
      });
    });

    it('returns 200 after membership exists and 403 for unknown org header', async () => {
      const slug = `active-org-e2e-${Date.now()}`;
      const create = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${ctxToken}`)
        .send({ name: 'Active Org E2E', slug })
        .expect(201);

      const orgId = create.body.data.id as string;

      const dataSource = app.get(DataSource);
      await dataSource.query(
        `INSERT INTO organisation_memberships ("id", "createdAt", "updatedAt", "isDeleted", "deletedAt", "role", "userId", "organisationId") VALUES (uuid_generate_v4(), NOW(), NOW(), false, NULL, $1::organisation_role, $2, $3)`,
        ['owner', userId, orgId],
      );

      const refreshed = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: ctxRefreshToken })
        .expect(200);
      const freshAccess = refreshed.body.data.accessToken as string;
      ctxRefreshToken = refreshed.body.data.refreshToken as string;

      const ok = await request(app.getHttpServer())
        .get('/api/v1/auth/active-organisation')
        .set('Authorization', `Bearer ${freshAccess}`)
        .expect(200);

      expect(ok.body.message).toBe('Active organisation resolved');
      expect(ok.body.data).toEqual({
        organisationId: orgId,
        roles: ['owner'],
      });

      const badOrg = await request(app.getHttpServer())
        .get('/api/v1/auth/active-organisation')
        .set('Authorization', `Bearer ${freshAccess}`)
        .set('X-Organisation-Id', '00000000-0000-4000-8000-000000000099')
        .expect(403);

      expectFilteredHttpExceptionBody(badOrg.body as Record<string, unknown>, {
        statusCode: 403,
        message: 'You are not a member of this organisation',
        path: '/api/v1/auth/active-organisation',
        error: 'Forbidden',
      });
    });
  });
});
