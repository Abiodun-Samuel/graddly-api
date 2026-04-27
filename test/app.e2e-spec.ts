import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          message: 'Success',
          data: 'Hello World!',
        });
        expect(res.headers['x-request-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      });
  });

  it('/api/v1 echoes incoming X-Request-Id', () => {
    const id = 'client-correlation-abc';
    return request(app.getHttpServer())
      .get('/api/v1')
      .set('X-Request-Id', id)
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-request-id']).toBe(id);
      });
  });

  it('/api/v1 echoes incoming X-Correlation-Id when X-Request-Id is absent', () => {
    const id = 'corr-from-mobile-client';
    return request(app.getHttpServer())
      .get('/api/v1')
      .set('X-Correlation-Id', id)
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-request-id']).toBe(id);
      });
  });

  it('404 responses match standard error envelope and requestId header', () => {
    return request(app.getHttpServer())
      .get('/api/v1/no-such-route-e2e')
      .expect(404)
      .expect((res) => {
        const rid = res.headers['x-request-id'];
        expect(typeof rid).toBe('string');
        expect(rid.length).toBeGreaterThan(0);
        expect(res.body).toEqual({
          message: 'Cannot GET /api/v1/no-such-route-e2e',
          error: 'Not Found',
          statusCode: 404,
          timestamp: expect.any(String),
          path: '/api/v1/no-such-route-e2e',
          requestId: rid,
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
