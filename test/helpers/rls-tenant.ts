import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { createVerifiedUser } from './e2e-http.js';

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
  const user = await createVerifiedUser(app, {
    firstName: label,
    lastName: 'User',
    email: `rls-${label}-${Date.now()}@example.com`,
    password: 'P@ssw0rd!',
  });

  const createRes = await request(app.getHttpServer())
    .post('/api/v1/organisations')
    .set('Authorization', `Bearer ${user.accessToken}`)
    .send({ name: `${label} Trust`, slug: `rls-${label}-${Date.now()}` })
    .expect(201);

  return {
    accessToken: user.accessToken,
    organisationId: (createRes.body as { data: { id: string } }).data.id,
    userId: user.userId,
    email: user.email,
  };
}
