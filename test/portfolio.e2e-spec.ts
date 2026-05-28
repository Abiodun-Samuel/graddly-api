import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module.js';
import { AuditAction } from '../src/audit/enums/audit-action.enum.js';
import { ORGANISATION_ID_HEADER } from '../src/common/constants/organisation-headers.js';
import { configureApp } from '../src/configure-app.js';
import { KsEvidenceStatus } from '../src/portfolio/enums/ks-evidence-status.enum.js';
import { KsbCoverageAssessment } from '../src/portfolio/enums/ksb-coverage-assessment.enum.js';
import { KsbHeatmapStrength } from '../src/portfolio/enums/ksb-heatmap-strength.enum.js';
import { KsbKind } from '../src/portfolio/enums/ksb-kind.enum.js';
import { noopStorageObjects } from '../src/storage/providers/noop-storage.store.js';

import { createVerifiedUser } from './helpers/e2e-http.js';
import { buildOrgPayload } from './helpers/e2e-organisation.js';
import { expectSuccessEnvelope } from './helpers/e2e-response-contracts.js';

describe('Portfolio (e2e)', () => {
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

  async function seedOrgContext(suffix: number) {
    const owner = await createVerifiedUser(app, {
      email: `portfolio-owner-${suffix}@example.com`,
    });

    const orgRes = await request(app.getHttpServer())
      .post('/api/v1/organisations')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(buildOrgPayload(`Portfolio Org ${suffix}`))
      .expect(201);
    const orgId = (orgRes.body as { data: { id: string } }).data.id;

    const programmeRes = await request(app.getHttpServer())
      .post('/api/v1/programmes')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({
        code: `PFL-PROG-${suffix}`,
        title: 'Portfolio Programme',
        status: 'active',
      })
      .expect(201);
    const programmeId = (programmeRes.body as { data: { id: string } }).data.id;

    const standardRes = await request(app.getHttpServer())
      .post('/api/v1/standards')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({
        programmeId,
        code: `PFL-STD-${suffix}`,
        title: 'Portfolio Standard',
        status: 'active',
      })
      .expect(201);
    const standardId = (standardRes.body as { data: { id: string } }).data.id;

    const ksb1Res = await request(app.getHttpServer())
      .post(`/api/v1/standards/${standardId}/ksb-definitions`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({ code: 'K1', kind: KsbKind.KNOWLEDGE, title: 'Knowledge 1' })
      .expect(201);
    const ksb1Id = (ksb1Res.body as { data: { id: string } }).data.id;

    const ksb2Res = await request(app.getHttpServer())
      .post(`/api/v1/standards/${standardId}/ksb-definitions`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({ code: 'S1', kind: KsbKind.SKILL, title: 'Skill 1' })
      .expect(201);
    const ksb2Id = (ksb2Res.body as { data: { id: string } }).data.id;

    const apprenticeRes = await request(app.getHttpServer())
      .post('/api/v1/apprentices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({
        firstName: 'Port',
        lastName: 'Folio',
        email: `portfolio-apprentice-${suffix}@example.com`,
      })
      .expect(201);
    const apprenticeId = (apprenticeRes.body as { data: { id: string } }).data
      .id;

    const enrolmentRes = await request(app.getHttpServer())
      .post('/api/v1/enrolments')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({ apprenticeId, standardId })
      .expect(201);
    const enrolmentId = (enrolmentRes.body as { data: { id: string } }).data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/enrolments/${enrolmentId}/activate`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .expect(201);

    return { owner, orgId, enrolmentId, apprenticeId, ksb1Id, ksb2Id };
  }

  it('evidence workflow, heatmap, and audit export', async () => {
    const suffix = Date.now();
    const { owner, orgId, enrolmentId, apprenticeId, ksb1Id } =
      await seedOrgContext(suffix);

    const uploadRes = await request(app.getHttpServer())
      .post('/api/v1/ksb-evidence-items/upload-url')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({
        apprenticeId,
        filename: 'evidence.pdf',
        contentType: 'application/pdf',
        contentLength: 1024,
      })
      .expect(201);

    const storageKey = (uploadRes.body as { data: { key: string } }).data.key;
    noopStorageObjects.set(storageKey, Buffer.from('fake-pdf'));

    const fileRes = await request(app.getHttpServer())
      .post('/api/v1/ksb-evidence-items')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({
        enrolmentId,
        apprenticeId,
        type: 'file',
        title: 'Work sample PDF',
        storageKey,
        ksbDefinitionIds: [ksb1Id],
      })
      .expect(201);

    const fileId = (fileRes.body as { data: { id: string } }).data.id;

    await request(app.getHttpServer())
      .post('/api/v1/ksb-evidence-items')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({
        enrolmentId,
        apprenticeId,
        type: 'link',
        title: 'Reference link',
        externalUrl: 'https://example.com/portfolio',
        ksbDefinitionIds: [ksb1Id],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/ksb-evidence-items')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({
        enrolmentId,
        apprenticeId,
        type: 'text',
        title: 'Reflection',
        body: 'Demonstrated understanding of the standard.',
        ksbDefinitionIds: [ksb1Id],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/ksb-evidence-items/${fileId}/submit`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/ksb-evidence-items/${fileId}/review`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/ksb-evidence-items/${fileId}/accept`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .expect(201);

    const heatmapRes = await request(app.getHttpServer())
      .get('/api/v1/portfolio/ksb-heatmap')
      .query({ enrolmentId })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .expect(200);

    expectSuccessEnvelope(heatmapRes.body);
    type HeatmapBody = {
      data: {
        cells: Array<{
          ksbDefinitionId: string;
          strength: string;
          evidenceCount: number;
        }>;
      };
    };
    const cells = (heatmapRes.body as HeatmapBody).data.cells;
    const k1Cell = cells.find((c) => c.ksbDefinitionId === ksb1Id);
    expect(k1Cell?.evidenceCount).toBeGreaterThanOrEqual(1);
    expect(k1Cell?.strength).toBe(KsbHeatmapStrength.LOW);

    await request(app.getHttpServer())
      .put(`/api/v1/portfolio/enrolments/${enrolmentId}/ksb-coverage/${ksb1Id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .send({ assessment: KsbCoverageAssessment.SUFFICIENT })
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/ksb-evidence-items')
      .query({ enrolmentId, status: KsEvidenceStatus.ACCEPTED })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .expect(200);

    expectSuccessEnvelope(listRes.body);
    expect((listRes.body as { data: unknown[] }).data.length).toBeGreaterThan(
      0,
    );

    const auditEvidence = await request(app.getHttpServer())
      .get('/api/v1/audit/export')
      .query({ entityType: 'ks_evidence_items' })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .expect(200);

    expectSuccessEnvelope(auditEvidence.body);
    const evidenceRows = (
      auditEvidence.body as {
        data: Array<{ action: AuditAction; entityId: string }>;
      }
    ).data;
    expect(evidenceRows.some((r) => r.entityId === fileId)).toBe(true);
    expect(evidenceRows.some((r) => r.action === AuditAction.INSERT)).toBe(
      true,
    );
    expect(evidenceRows.some((r) => r.action === AuditAction.UPDATE)).toBe(
      true,
    );

    const auditMappings = await request(app.getHttpServer())
      .get('/api/v1/audit/export')
      .query({ entityType: 'ks_evidence_ksb_mappings' })
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .set(ORGANISATION_ID_HEADER, orgId)
      .expect(200);

    expectSuccessEnvelope(auditMappings.body);
    expect(
      (auditMappings.body as { data: unknown[] }).data.length,
    ).toBeGreaterThan(0);
  });
});
