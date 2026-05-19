import request from 'supertest';

import { findEmailVerificationTokenForUserId } from './email-verification-redis.js';
import { getUserIdByEmail } from './rls-db.js';

import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';

export interface ISignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IVerifiedUserFixture {
  userId: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
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

/**
 * Completes email verification for an existing unverified user.
 * Uses Redis value lookup by user id (safe when e2e suites run in parallel).
 */
export async function verifyUserEmail(
  app: INestApplication<App>,
  email: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const userId = await getUserIdByEmail(email);
  let token = await findEmailVerificationTokenForUserId(userId);

  if (!token) {
    await request(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .send({ email })
      .expect(204);
    token = await findEmailVerificationTokenForUserId(userId);
  }

  if (!token) {
    throw new Error(
      `Expected email verification token in Redis for user ${userId}`,
    );
  }

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/verify-email')
    .send({ token });

  if (res.status !== 200) {
    throw new Error(
      `Expected verify-email 200, got ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }

  return {
    accessToken: res.body.data.accessToken as string,
    refreshToken: res.body.data.refreshToken as string,
  };
}

/** Sign up, verify email, and return auth context for authenticated e2e tests. */
export async function createVerifiedUser(
  app: INestApplication<App>,
  partial?: Partial<ISignupPayload>,
): Promise<IVerifiedUserFixture> {
  const payload: ISignupPayload = {
    firstName: partial?.firstName ?? 'E2E',
    lastName: partial?.lastName ?? 'User',
    email: partial?.email ?? `e2e-verified-${Date.now()}@example.com`,
    password: partial?.password ?? 'P@ssw0rd!',
  };

  await signupUser(app, payload);
  const tokens = await verifyUserEmail(app, payload.email);
  const userId = await getUserIdByEmail(payload.email);

  return {
    userId,
    email: payload.email,
    password: payload.password,
    ...tokens,
  };
}

export async function signupAndVerifyUser(
  app: INestApplication<App>,
  payload: ISignupPayload,
): Promise<IVerifiedUserFixture> {
  return createVerifiedUser(app, payload);
}

/** Log in a user who has already verified their email. */
export async function loginVerifiedUser(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(
      `Expected login 200, got ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }

  return {
    accessToken: res.body.data.accessToken as string,
    refreshToken: res.body.data.refreshToken as string,
  };
}
