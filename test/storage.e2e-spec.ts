import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { StorageObjectCategory } from '../src/storage/enums/storage-object-category.enum.js';
import { MAX_FILE_SIZE_BYTES } from '../src/storage/storage.constants.js';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import { createVerifiedUser, loginVerifiedUser } from './helpers/e2e-http.js';
import { buildOrgPayload } from './helpers/e2e-organisation.js';
import {
  expectFilteredHttpExceptionBody,
  expectSuccessEnvelope,
} from './helpers/e2e-response-contracts.js';

async function createUserWithOrg(
  app: INestApplication<App>,
  email: string,
  orgName: string,
): Promise<{ accessToken: string; organisationId: string }> {
  const user = await createVerifiedUser(app, { email });

  const orgRes = await request(app.getHttpServer())
    .post('/api/v1/organisations')
    .set('Authorization', `Bearer ${user.accessToken}`)
    .send(buildOrgPayload(orgName))
    .expect(201);

  const organisationId = (orgRes.body as { data: { id: string } }).data.id;
  const { accessToken } = await loginVerifiedUser(
    app,
    user.email,
    user.password,
  );

  return { accessToken, organisationId };
}

describe('StorageController (e2e)', () => {
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

  it('creates presigned upload and download URLs with noop provider', async () => {
    const suffix = Date.now();
    const { accessToken, organisationId } = await createUserWithOrg(
      app,
      `storage-${suffix}@example.com`,
      `Storage Org ${suffix}`,
    );

    const uploadRes = await request(app.getHttpServer())
      .post('/api/v1/storage/upload-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        filename: 'evidence.pdf',
        contentType: 'application/pdf',
        contentLength: 1024,
        category: StorageObjectCategory.EVIDENCE,
      })
      .expect(201);

    expectSuccessEnvelope(uploadRes.body);
    const uploadData = (
      uploadRes.body as {
        data: { key: string; uploadUrl: string; expiresAt: string };
      }
    ).data;
    expect(uploadData.key).toMatch(
      new RegExp(`^orgs/${organisationId}/evidence/`),
    );
    expect(uploadData.uploadUrl).toContain('noop-storage.local');

    const downloadRes = await request(app.getHttpServer())
      .post('/api/v1/storage/download-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ key: uploadData.key })
      .expect(201);

    expectSuccessEnvelope(downloadRes.body);
    expect(
      (downloadRes.body as { data: { downloadUrl: string } }).data.downloadUrl,
    ).toContain('noop-storage.local');
  });

  it('returns 422 for disallowed mime types', async () => {
    const suffix = Date.now();
    const { accessToken } = await createUserWithOrg(
      app,
      `storage-bad-mime-${suffix}@example.com`,
      `Storage Mime Org ${suffix}`,
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/storage/upload-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
        contentLength: 100,
        category: StorageObjectCategory.GENERAL,
      })
      .expect(422);

    expect(res.body.message).toBe('Validation Error');
  });

  it('returns 422 when file exceeds 25 MB', async () => {
    const suffix = Date.now();
    const { accessToken } = await createUserWithOrg(
      app,
      `storage-big-${suffix}@example.com`,
      `Storage Big Org ${suffix}`,
    );

    await request(app.getHttpServer())
      .post('/api/v1/storage/upload-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        filename: 'large.pdf',
        contentType: 'application/pdf',
        contentLength: MAX_FILE_SIZE_BYTES + 1,
        category: StorageObjectCategory.GENERAL,
      })
      .expect(422);
  });

  it('returns 403 when download key is outside active org', async () => {
    const suffix = Date.now();
    const { accessToken } = await createUserWithOrg(
      app,
      `storage-cross-${suffix}@example.com`,
      `Storage Cross Org ${suffix}`,
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/storage/download-url')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        key: 'orgs/99999999-9999-9999-9999-999999999999/general/obj/file.pdf',
      })
      .expect(403);

    expectFilteredHttpExceptionBody(res.body as Record<string, unknown>, {
      statusCode: 403,
      message: 'Access denied for this object key',
      path: '/api/v1/storage/download-url',
      error: 'Forbidden',
    });
  });
});
