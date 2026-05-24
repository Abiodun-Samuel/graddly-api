import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

import { createVerifiedUser, loginVerifiedUser } from './helpers/e2e-http.js';
import { buildOrgPayload } from './helpers/e2e-organisation.js';
import {
  expectFilteredHttpExceptionBody,
  expectPaginatedListEnvelope,
} from './helpers/e2e-response-contracts.js';
import { findInvitationAcceptTokenForInvitationId } from './helpers/invitation-accept-redis.js';

describe('AuditController (e2e)', () => {
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

  it('records invitation insert and exports JSON for owner; member forbidden; CSV raw', async () => {
    const suffix = Date.now();
    const owner = await createVerifiedUser(app, {
      email: `audit-owner-${suffix}@example.com`,
    });

    const orgRes = await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildOrgPayload(`Audit Org ${suffix}`))
      .expect(201);

    const organisationId = (orgRes.body as { data: { id: string } }).data.id;

    const { accessToken: ownerToken } = await loginVerifiedUser(
      app,
      owner.email,
      owner.password,
    );

    const invitee = await createVerifiedUser(app, {
      email: `audit-invitee-${suffix}@example.com`,
    });

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: invitee.email, role: 'member' })
      .expect(201);

    const invitationId = (createRes.body as { data: { id: string } }).data.id;
    const acceptToken =
      await findInvitationAcceptTokenForInvitationId(invitationId);
    expect(acceptToken).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/v1/invitations/accept')
      .set('Authorization', `Bearer ${invitee.accessToken}`)
      .send({ token: acceptToken })
      .expect(200);

    const exportRes = await request(app.getHttpServer())
      .get(
        '/api/v1/audit/export?page=1&perPage=20&entityType=invitations&action=insert',
      )
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expectPaginatedListEnvelope(exportRes.body);
    const items = (
      exportRes.body as {
        data: {
          entityType: string;
          action: string;
          organisationId: string;
        }[];
      }
    ).data;

    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items.some((item) => item.entityType === 'invitations')).toBe(true);
    expect(items.some((item) => item.action === 'insert')).toBe(true);
    expect(items.every((item) => item.organisationId === organisationId)).toBe(
      true,
    );

    const { accessToken: memberToken } = await loginVerifiedUser(
      app,
      invitee.email,
      invitee.password,
    );

    const forbiddenExport = await request(app.getHttpServer())
      .get('/api/v1/audit/export?page=1&perPage=10')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    expectFilteredHttpExceptionBody(
      forbiddenExport.body as Record<string, unknown>,
      {
        statusCode: 403,
        message: 'Insufficient permissions',
        path: /^\/api\/v1\/audit\/export/,
        error: 'Forbidden',
      },
    );

    const csvRes = await request(app.getHttpServer())
      .get('/api/v1/audit/export?format=csv&page=1&perPage=10')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(csvRes.headers['content-type']).toMatch(/text\/csv/);
    expect(String(csvRes.text)).toContain('entityType');
    expect(String(csvRes.text)).toContain('invitations');
  });
});
