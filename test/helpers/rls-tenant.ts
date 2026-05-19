import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

export interface IRlsTenantFixture {
  accessToken: string;
  organisationId: string;
  userId: string;
  email: string;
}

export async function signupLoginAndCreateOrg(
  app: INestApplication<App>,
  label: string,
): Promise<IRlsTenantFixture> {
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

  const meRes = await request(app.getHttpServer())
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);

  const userId = (meRes.body as { data: { id: string } }).data.id;

  const createRes = await request(app.getHttpServer())
    .post('/api/v1/organisations')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ name: `${label} Trust`, slug: `rls-${label}-${Date.now()}` })
    .expect(201);

  return {
    accessToken,
    organisationId: (createRes.body as { data: { id: string } }).data.id,
    userId,
    email,
  };
}
