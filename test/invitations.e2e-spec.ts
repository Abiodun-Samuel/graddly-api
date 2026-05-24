import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import { createVerifiedUser, loginVerifiedUser } from './helpers/e2e-http.js';
import { buildOrgPayload } from './helpers/e2e-organisation.js';
import {
  expectFilteredHttpExceptionBody,
  expectPaginatedListEnvelope,
  expectSuccessEnvelope,
} from './helpers/e2e-response-contracts.js';
import { findInvitationAcceptTokenForInvitationId } from './helpers/invitation-accept-redis.js';

describe('InvitationsController (e2e)', () => {
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

  it('create → list (paginated) → accept → member cannot create; invite disappears from list', async () => {
    const suffix = Date.now();
    const owner = await createVerifiedUser(app, {
      email: `inv-owner-${suffix}@example.com`,
    });

    const orgRes = await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildOrgPayload('Invite Org'))
      .expect(201);

    const organisationId = (orgRes.body as { data: { id: string } }).data.id;

    const { accessToken: ownerToken } = await loginVerifiedUser(
      app,
      owner.email,
      owner.password,
    );

    const invitee = await createVerifiedUser(app, {
      email: `inv-invitee-${suffix}@example.com`,
    });

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: invitee.email, role: 'member' })
      .expect(201);

    expectSuccessEnvelope(createRes.body);
    const invitationId = (createRes.body as { data: { id: string } }).data.id;
    expect(invitationId).toEqual(expect.any(String));

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/invitations?page=1&perPage=10')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expectPaginatedListEnvelope(listRes.body);
    expect(
      (listRes.body as { meta: { total: number } }).meta.total,
    ).toBeGreaterThanOrEqual(1);

    const acceptToken =
      await findInvitationAcceptTokenForInvitationId(invitationId);
    expect(acceptToken).toBeTruthy();

    const acceptRes = await request(app.getHttpServer())
      .post('/api/v1/invitations/accept')
      .set('Authorization', `Bearer ${invitee.accessToken}`)
      .send({ token: acceptToken })
      .expect(200);

    expectSuccessEnvelope(acceptRes.body);
    expect(acceptRes.body.data).toEqual(
      expect.objectContaining({
        organisationId,
        role: 'member',
      }),
    );

    const { accessToken: memberToken } = await loginVerifiedUser(
      app,
      invitee.email,
      invitee.password,
    );

    const forbiddenCreate = await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: `other-${suffix}@example.com`, role: 'member' })
      .expect(403);

    expectFilteredHttpExceptionBody(
      forbiddenCreate.body as Record<string, unknown>,
      {
        statusCode: 403,
        message: 'Insufficient permissions',
        path: '/api/v1/invitations',
        error: 'Forbidden',
      },
    );

    const listAfter = await request(app.getHttpServer())
      .get('/api/v1/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expectPaginatedListEnvelope(listAfter.body);
    const rows = (listAfter.body as { data: { id: string }[] }).data;
    expect(rows.find((r) => r.id === invitationId)).toBeUndefined();
  });

  it('DELETE revoke clears accept token', async () => {
    const suffix = Date.now();
    const owner = await createVerifiedUser(app, {
      email: `inv-revoke-owner-${suffix}@example.com`,
    });

    await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildOrgPayload('Revoke Org'))
      .expect(201);

    const { accessToken: ownerToken } = await loginVerifiedUser(
      app,
      owner.email,
      owner.password,
    );

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: `revoked-invitee-${suffix}@example.com`, role: 'member' })
      .expect(201);

    const invitationId = (createRes.body as { data: { id: string } }).data.id;
    const tokenBefore =
      await findInvitationAcceptTokenForInvitationId(invitationId);
    expect(tokenBefore).toBeTruthy();

    await request(app.getHttpServer())
      .delete(`/api/v1/invitations/${invitationId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    const tokenAfter =
      await findInvitationAcceptTokenForInvitationId(invitationId);
    expect(tokenAfter).toBeNull();
  });
});
