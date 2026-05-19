import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';

describe('OIDC routes (e2e, disabled)', () => {
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

  it('GET /auth/oidc/login returns 404', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/oidc/login')
      .expect(404);

    expect(res.body.message).toMatch(
      /Cannot GET \/api\/v1\/auth\/oidc\/login/u,
    );
  });

  it('GET /auth/oidc/callback returns 404', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/oidc/callback')
      .expect(404);

    expect(res.body.message).toMatch(
      /Cannot GET \/api\/v1\/auth\/oidc\/callback/u,
    );
  });
});
