import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { SignatureRecordStatus } from '../src/esignature/enums/signature-record-status.enum.js';
import { PdfJobTemplate } from '../src/pdf/enums/pdf-job-template.enum.js';
import { StorageObjectCategory } from '../src/storage/enums/storage-object-category.enum.js';
import { noopStorageObjects } from '../src/storage/providers/noop-storage.store.js';

import { createVerifiedUser, loginVerifiedUser } from './helpers/e2e-http.js';
import { buildOrgPayload } from './helpers/e2e-organisation.js';
import { expectSuccessEnvelope } from './helpers/e2e-response-contracts.js';
import { processPdfJobInApp } from './helpers/process-pdf-job.js';

describe('EsignatureController (e2e)', () => {
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

  beforeEach(() => {
    noopStorageObjects.clear();
  });

  it('creates signature record and stores signed PDF', async () => {
    const suffix = Date.now();
    const owner = await createVerifiedUser(app, {
      email: `esign-owner-${suffix}@example.com`,
    });

    const orgRes = await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildOrgPayload(`Esign Org ${suffix}`))
      .expect(201);

    const organisationId = (orgRes.body as { data: { id: string } }).data.id;

    const { accessToken: ownerToken } = await loginVerifiedUser(
      app,
      owner.email,
      owner.password,
    );

    const createJobRes = await request(app.getHttpServer())
      .post('/api/v1/pdf/jobs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ template: PdfJobTemplate.HELLO })
      .expect(201);

    const jobId = (createJobRes.body as { data: { jobId: string } }).data.jobId;
    await processPdfJobInApp(app, {
      jobId,
      organisationId,
      userId: owner.userId,
      template: PdfJobTemplate.HELLO,
    });

    const signatureKey = `orgs/${organisationId}/${StorageObjectCategory.SIGNATURE}/sig-obj/signature.png`;
    noopStorageObjects.set(signatureKey, Buffer.from('fake-signature-bytes'));

    const createRecordRes = await request(app.getHttpServer())
      .post('/api/v1/esignature/records')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ signatureImageKey: signatureKey, pdfJobId: jobId })
      .expect(201);

    expectSuccessEnvelope(createRecordRes.body);
    const recordId = (createRecordRes.body as { data: { id: string } }).data.id;

    const signRes = await request(app.getHttpServer())
      .post(`/api/v1/esignature/records/${recordId}/sign`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expectSuccessEnvelope(signRes.body);
    const signedPdfKey = (signRes.body as { data: { signedPdfKey: string } })
      .data.signedPdfKey;
    expect(signedPdfKey).toContain('signed-');
    expect(noopStorageObjects.has(signedPdfKey)).toBe(true);

    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/esignature/records/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expectSuccessEnvelope(getRes.body);
    expect((getRes.body as { data: { status: string } }).data.status).toBe(
      SignatureRecordStatus.SIGNED,
    );
  });
});
