import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import {
  expectFilteredHttpExceptionBody,
  expectSuccessEnvelope,
} from './helpers/e2e-response-contracts.js';

describe('RLS tenant isolation (e2e)', () => {
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

  async function signupLoginAndCreateOrg(
    label: string,
  ): Promise<{ accessToken: string; organisationId: string }> {
    const email = `rls-${label}-${Date.now()}@example.com`;
    const password = 'P@ssw0rd!';

    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        firstName: label,
        lastName: 'User',
        email,
        password,
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const accessToken = loginRes.body.data.accessToken as string;

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `${label} Trust`, slug: `rls-${label}-${Date.now()}` })
      .expect(201);

    return {
      accessToken,
      organisationId: (createRes.body as { data: { id: string } }).data.id,
    };
  }

  it('prevents cross-tenant organisation access when RLS is enabled', async () => {
    const tenantA = await signupLoginAndCreateOrg('tenant-a');
    const tenantB = await signupLoginAndCreateOrg('tenant-b');

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/organisations')
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .expect(200);

    expectSuccessEnvelope(listRes.body);
    const ids = (listRes.body.data as { id: string }[]).map((o) => o.id);
    expect(ids).toContain(tenantA.organisationId);
    expect(ids).not.toContain(tenantB.organisationId);

    const getOtherRes = await request(app.getHttpServer())
      .get(`/api/v1/organisations/${tenantB.organisationId}`)
      .set('Authorization', `Bearer ${tenantA.accessToken}`)
      .expect(404);

    expectFilteredHttpExceptionBody(
      getOtherRes.body as Record<string, unknown>,
      {
        statusCode: 404,
        message: 'Organisation not found',
        path: `/api/v1/organisations/${tenantB.organisationId}`,
        error: 'Not Found',
      },
    );
  });
});
