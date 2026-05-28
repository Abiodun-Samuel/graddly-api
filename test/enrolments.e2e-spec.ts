import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module.js';
import { AuditAction } from '../src/audit/enums/audit-action.enum.js';
import { ORGANISATION_ID_HEADER } from '../src/common/constants/organisation-headers.js';
import { configureApp } from '../src/configure-app.js';
import { EnrolmentStatus } from '../src/enrolments/enums/enrolment-status.enum.js';

import { createVerifiedUser } from './helpers/e2e-http.js';
import { buildOrgPayload } from './helpers/e2e-organisation.js';
import {
  expectFilteredHttpExceptionBody,
  expectPaginatedListEnvelope,
  expectSuccessEnvelope,
} from './helpers/e2e-response-contracts.js';

describe('Enrolments + domain APIs (e2e)', () => {
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

  it('supports scoped lifecycle and emits audit logs', async () => {
    const suffix = Date.now();
    const owner = await createVerifiedUser(app, {
      email: `enrol-owner-${suffix}@example.com`,
    });

    const orgOneRes = await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildOrgPayload(`Enrol Org One ${suffix}`))
      .expect(201);
    const orgOneId = (orgOneRes.body as { data: { id: string } }).data.id;

    const orgTwoRes = await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildOrgPayload(`Enrol Org Two ${suffix}`))
      .expect(201);
    const orgTwoId = (orgTwoRes.body as { data: { id: string } }).data.id;

    const programmeRes = await request(app.getHttpServer())
      .post('/api/v1/programmes')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({
        code: `PROG-${suffix}`,
        title: 'Programme One',
        status: 'active',
      })
      .expect(201);
    expectSuccessEnvelope(programmeRes.body);
    const programmeId = (programmeRes.body as { data: { id: string } }).data.id;
    expect((programmeRes.body as { data: { code: string } }).data.code).toBe(
      `PROG-${suffix}`,
    );

    const getProgrammeRes = await request(app.getHttpServer())
      .get(`/api/v1/programmes/${programmeId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);
    expectSuccessEnvelope(getProgrammeRes.body);
    expect((getProgrammeRes.body as { data: { id: string } }).data.id).toBe(
      programmeId,
    );

    const standardRes = await request(app.getHttpServer())
      .post('/api/v1/standards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({
        programmeId,
        code: `STD-${suffix}`,
        title: 'Standard One',
        status: 'active',
      })
      .expect(201);
    expectSuccessEnvelope(standardRes.body);
    const standardId = (standardRes.body as { data: { id: string } }).data.id;
    const getStandardRes = await request(app.getHttpServer())
      .get(`/api/v1/standards/${standardId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);
    expectSuccessEnvelope(getStandardRes.body);

    const apprenticeRes = await request(app.getHttpServer())
      .post('/api/v1/apprentices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({
        firstName: 'Ap',
        lastName: 'Prentice',
        email: `apprentice-${suffix}@example.com`,
      })
      .expect(201);
    expectSuccessEnvelope(apprenticeRes.body);
    const apprenticeId = (apprenticeRes.body as { data: { id: string } }).data
      .id;
    const getApprenticeRes = await request(app.getHttpServer())
      .get(`/api/v1/apprentices/${apprenticeId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);
    expectSuccessEnvelope(getApprenticeRes.body);

    const enrolmentRes = await request(app.getHttpServer())
      .post('/api/v1/enrolments')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({ apprenticeId, standardId })
      .expect(201);
    expectSuccessEnvelope(enrolmentRes.body);
    const enrolmentId = (enrolmentRes.body as { data: { id: string } }).data.id;
    const getEnrolmentRes = await request(app.getHttpServer())
      .get(`/api/v1/enrolments/${enrolmentId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);
    expectSuccessEnvelope(getEnrolmentRes.body);

    const programmesListRes = await request(app.getHttpServer())
      .get('/api/v1/programmes')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);
    expectPaginatedListEnvelope(programmesListRes.body);
    expect(
      (
        programmesListRes.body as {
          data: Array<{ id: string }>;
          meta: { total: number; page: number; perPage: number };
        }
      ).meta,
    ).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        page: 1,
        perPage: 10,
      }),
    );

    const standardsListRes = await request(app.getHttpServer())
      .get('/api/v1/standards')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);
    expectPaginatedListEnvelope(standardsListRes.body);

    const apprenticesListRes = await request(app.getHttpServer())
      .get('/api/v1/apprentices')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);
    expectPaginatedListEnvelope(apprenticesListRes.body);

    const enrolmentsListRes = await request(app.getHttpServer())
      .get('/api/v1/enrolments')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);
    expectPaginatedListEnvelope(enrolmentsListRes.body);

    const updatedProgrammeRes = await request(app.getHttpServer())
      .patch(`/api/v1/programmes/${programmeId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({ title: 'Programme One Updated' })
      .expect(200);
    expectSuccessEnvelope(updatedProgrammeRes.body);
    expect(
      (updatedProgrammeRes.body as { data: { title: string } }).data.title,
    ).toBe('Programme One Updated');

    const updatedStandardRes = await request(app.getHttpServer())
      .patch(`/api/v1/standards/${standardId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({ title: 'Standard One Updated' })
      .expect(200);
    expectSuccessEnvelope(updatedStandardRes.body);

    const updatedApprenticeRes = await request(app.getHttpServer())
      .patch(`/api/v1/apprentices/${apprenticeId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({ firstName: 'Ap Updated' })
      .expect(200);
    expectSuccessEnvelope(updatedApprenticeRes.body);

    const activeRes = await request(app.getHttpServer())
      .post(`/api/v1/enrolments/${enrolmentId}/activate`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(201);
    expectSuccessEnvelope(activeRes.body);
    expect((activeRes.body as { data: { status: string } }).data.status).toBe(
      EnrolmentStatus.ACTIVE,
    );

    const completeRes = await request(app.getHttpServer())
      .post(`/api/v1/enrolments/${enrolmentId}/complete`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(201);
    expectSuccessEnvelope(completeRes.body);
    expect((completeRes.body as { data: { status: string } }).data.status).toBe(
      EnrolmentStatus.COMPLETED,
    );

    const crossOrgRes = await request(app.getHttpServer())
      .get(`/api/v1/enrolments/${enrolmentId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgTwoId)
      .expect(404);
    expectFilteredHttpExceptionBody(
      crossOrgRes.body as Record<string, unknown>,
      {
        statusCode: 404,
        message: 'Enrolment not found',
        path: `/api/v1/enrolments/${enrolmentId}`,
        error: 'Not Found',
      },
    );

    const apprenticeTwoRes = await request(app.getHttpServer())
      .post('/api/v1/apprentices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({
        firstName: 'Cancel',
        lastName: 'Flow',
        email: `apprentice-cancel-${suffix}@example.com`,
      })
      .expect(201);
    expectSuccessEnvelope(apprenticeTwoRes.body);
    const apprenticeTwoId = (apprenticeTwoRes.body as { data: { id: string } })
      .data.id;

    const enrolmentToCancelRes = await request(app.getHttpServer())
      .post('/api/v1/enrolments')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .send({ apprenticeId: apprenticeTwoId, standardId })
      .expect(201);
    expectSuccessEnvelope(enrolmentToCancelRes.body);
    const enrolmentToCancelId = (
      enrolmentToCancelRes.body as { data: { id: string } }
    ).data.id;

    const cancelRes = await request(app.getHttpServer())
      .post(`/api/v1/enrolments/${enrolmentToCancelId}/cancel`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(201);
    expectSuccessEnvelope(cancelRes.body);
    expect((cancelRes.body as { data: { status: string } }).data.status).toBe(
      EnrolmentStatus.CANCELLED,
    );

    await request(app.getHttpServer())
      .delete(`/api/v1/apprentices/${apprenticeTwoId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(204);

    await request(app.getHttpServer())
      .delete(`/api/v1/standards/${standardId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(204);

    await request(app.getHttpServer())
      .delete(`/api/v1/programmes/${programmeId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(204);

    const auditRes = await request(app.getHttpServer())
      .get('/api/v1/audit/export')
      .query({ entityType: 'enrolments' })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgOneId)
      .expect(200);

    expectSuccessEnvelope(auditRes.body);
    const rows = (auditRes.body as { data: Array<{ action: AuditAction }> })
      .data;
    expect(rows.some((row) => row.action === AuditAction.INSERT)).toBe(true);
    expect(rows.some((row) => row.action === AuditAction.UPDATE)).toBe(true);
  });
});
