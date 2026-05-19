import request from 'supertest';

import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';

export interface ISignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function signupUser(
  app: INestApplication<App>,
  payload: ISignupPayload,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/signup')
    .send(payload);

  if (res.status !== 201) {
    throw new Error(
      `Expected signup 201, got ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }
}
