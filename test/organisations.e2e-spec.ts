import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import {
  expectFilteredHttpExceptionBody,
  expectOrganisationResource,
  expectSuccessEnvelope,
} from './helpers/e2e-response-contracts.js';

/** Minimal valid payload for POST /organisations. Slug is backend-generated. */
const baseOrgPayload = {
  name: 'Test Trust',
  ukprn: '10001001',
  address: '1 Test Lane',
  city: 'London',
  postcode: 'SW1A 1AA',
  country: 'United Kingdom',
  orgEmail: 'info@test-trust.co.uk',
};

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
  let userId: string;

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
      userId = (
        JSON.parse(
          Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
        ) as { sub: string }
      ).sub;
    });
  });

  describe('Organisations CRUD', () => {
    it('POST /organisations creates with { message, data: Organisation } and auto-generates slug', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(baseOrgPayload)
        .expect(201);

      expectSuccessEnvelope(res.body);
      expect(res.body.message).toBe('Organisation created successfully');
      expectOrganisationResource(res.body.data);
      expect(res.body.data).toMatchObject({
        name: 'Test Trust',
        slug: 'test-trust', // auto-generated from name
        ukprn: '10001001',
        address: '1 Test Lane',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
        orgEmail: 'info@test-trust.co.uk',
      });
      organisationId = (res.body as { data: { id: string } }).data.id;
    });

    it('POST /organisations auto-creates an owner membership for the creator', async () => {
      const dataSource = app.get(DataSource);
      const rows = await dataSource.query<
        { role: string; status: string; isDeleted: boolean; userId: string; organisationId: string }[]
      >(
        `SELECT role, status, "isDeleted", "userId", "organisationId" FROM organisation_memberships WHERE "organisationId" = $1`,
        [organisationId],
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        role: 'owner',
        status: 'active',
        isDeleted: false,
        userId,
        organisationId,
      });
    });

    it('POST /organisations returns 409 when UKPRN is already in use', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...baseOrgPayload, name: 'Different Trust' })
        .expect(409);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 409,
        message: 'An organisation with this UKPRN already exists',
        path: '/api/v1/organisations',
        error: 'Conflict',
      });
    });

    it('POST /organisations returns 422 for invalid payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/organisations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'X', ukprn: '123' })  // name too short, ukprn wrong format
        .expect(422);

      expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
        statusCode: 422,
        message: 'Validation Error',
        path: '/api/v1/organisations',
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

      const ours = (list as { id: string }[]).find((o) => o.id === organisationId);
      expect(ours).toEqual(
        expect.objectContaining({ id: organisationId, name: 'Test Trust', slug: 'test-trust' }),
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
        expect.objectContaining({ id: organisationId, name: 'Test Trust', slug: 'test-trust' }),
      );
    });

    it('PATCH /organisations/:id updates contact fields; slug stays unchanged', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/organisations/${organisationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Trust', city: 'Manchester' })
        .expect(200);

      expectSuccessEnvelope(res.body);
      expect(res.body.message).toBe('Organisation updated successfully');
      expectOrganisationResource(res.body.data);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: organisationId,
          name: 'Updated Trust',
          slug: 'test-trust',  // slug is immutable after creation
          city: 'Manchester',
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
