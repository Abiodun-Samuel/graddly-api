import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import {
  expectFilteredHttpExceptionBody,
  expectOrganisationResource,
  expectSuccessEnvelope,
} from './helpers/e2e-response-contracts.js';

describe('OrganisationsController (e2e)', () => {
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
    firstName: 'Org',
    lastName: 'Admin',
    email: 'org-admin-e2e@example.com',
    password: 'P@ssw0rd!',
  };

  let accessToken: string;
  let organisationId: string;

  describe('Auth setup', () => {
    it('signs up and logs in with locked response contracts', async () => {
      const signupRes = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send(signupDto)
        .expect(201);

      expect(signupRes.body).toEqual({
        message: 'Account created successfully',
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: signupDto.email, password: signupDto.password })
        .expect(200);

      expect(loginRes.body).toEqual({
        message: 'Logged in successfully',
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      accessToken = loginRes.body.data.accessToken as string;
    });
  });

  describe('Organisations CRUD', () => {
    it('POST /organisations creates with { message, data: Organisation }', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Trust', slug: 'test-trust-e2e' })
        .expect(201);

      expectSuccessEnvelope(res.body);
      expect(res.body.message).toBe('Organisation created successfully');
      expectOrganisationResource(res.body.data);
      expect(res.body.data).toMatchObject({
        name: 'Test Trust',
        slug: 'test-trust-e2e',
      });
      organisationId = (res.body as { data: { id: string } }).data.id;
    });

    it('POST /organisations returns 409 with standard error envelope', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Other', slug: 'test-trust-e2e' })
        .expect(409);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 409,
        message: 'An organisation with this slug already exists',
        path: '/api/v1/organisations',
        error: 'Conflict',
      });
    });

    it('GET /organisations lists { message, data: Organisation[] }', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/organisations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expectSuccessEnvelope(res.body);
      expect(res.body.message).toBe('Organisations retrieved successfully');
      const list = (res.body as { data: unknown[] }).data;
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(1);

      for (const row of list) {
        expectOrganisationResource(row);
      }

      const ours = (list as { id: string }[]).find(
        (o) => o.id === organisationId,
      );
      expect(ours).toEqual(
        expect.objectContaining({
          id: organisationId,
          name: 'Test Trust',
          slug: 'test-trust-e2e',
        }),
      );
    });

    it('GET /organisations/:id returns { message, data: Organisation }', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/organisations/${organisationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expectSuccessEnvelope(res.body);
      expect(res.body.message).toBe('Organisation retrieved successfully');
      expectOrganisationResource(res.body.data);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: organisationId,
          name: 'Test Trust',
          slug: 'test-trust-e2e',
        }),
      );
    });

    it('PATCH /organisations/:id returns { message, data: Organisation }', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/organisations/${organisationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Trust' })
        .expect(200);

      expectSuccessEnvelope(res.body);
      expect(res.body.message).toBe('Organisation updated successfully');
      expectOrganisationResource(res.body.data);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: organisationId,
          name: 'Updated Trust',
          slug: 'test-trust-e2e',
        }),
      );
    });

    it('DELETE /organisations/:id returns 204 with no JSON body', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/organisations/${organisationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
      expect(
        res.body === undefined || Object.keys(res.body as object).length === 0,
      ).toBe(true);
    });

    it('GET /organisations/:id returns 404 with standard error envelope', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/organisations/${organisationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 404,
        message: 'Organisation not found',
        path: `/api/v1/organisations/${organisationId}`,
        error: 'Not Found',
      });
    });

    it('returns 401 without token with standard error envelope', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/organisations')
        .expect(401);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 401,
        message: 'Unauthorized',
        path: '/api/v1/organisations',
      });
    });
  });
});
