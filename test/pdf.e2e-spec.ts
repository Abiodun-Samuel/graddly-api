import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PdfJobStatus } from '../src/pdf/enums/pdf-job-status.enum.js';
import { PdfJobTemplate } from '../src/pdf/enums/pdf-job-template.enum.js';
import { noopStorageObjects } from '../src/storage/providers/noop-storage.store.js';

import { createVerifiedUser, loginVerifiedUser } from './helpers/e2e-http.js';
import { buildOrgPayload } from './helpers/e2e-organisation.js';
import { expectSuccessEnvelope } from './helpers/e2e-response-contracts.js';
import { processPdfJobInApp } from './helpers/process-pdf-job.js';

describe('PdfController (e2e)', () => {
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

  it('returns sync hello PDF and completes async job with noop storage', async () => {
    const suffix = Date.now();
    const owner = await createVerifiedUser(app, {
      email: `pdf-owner-${suffix}@example.com`,
    });

    const orgRes = await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildOrgPayload(`Pdf Org ${suffix}`))
      .expect(201);

    const organisationId = (orgRes.body as { data: { id: string } }).data.id;

    const { accessToken: ownerToken } = await loginVerifiedUser(
      app,
      owner.email,
      owner.password,
    );

    const helloRes = await request(app.getHttpServer())
      .get('/api/v1/pdf/hello')
      .set('Authorization', `Bearer ${ownerToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(helloRes.headers['content-type']).toMatch(/application\/pdf/);
    const helloBody = helloRes.body as Buffer;
    expect(helloBody.subarray(0, 4).toString()).toBe('%PDF');

    const createJobRes = await request(app.getHttpServer())
      .post('/api/v1/pdf/jobs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ template: PdfJobTemplate.HELLO })
      .expect(201);

    expectSuccessEnvelope(createJobRes.body);
    const jobId = (createJobRes.body as { data: { jobId: string } }).data.jobId;

    await processPdfJobInApp(app, {
      jobId,
      organisationId,
      userId: owner.userId,
      template: PdfJobTemplate.HELLO,
    });

    const statusRes = await request(app.getHttpServer())
      .get(`/api/v1/pdf/jobs/${jobId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expectSuccessEnvelope(statusRes.body);
    const job = (
      statusRes.body as { data: { status: string; outputKey: string } }
    ).data;
    expect(job.status).toBe(PdfJobStatus.COMPLETED);
    expect(job.outputKey).toContain('/export/');
  });
});
