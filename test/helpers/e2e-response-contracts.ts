/**
 * Shared assertions for HTTP JSON bodies so e2e tests lock API contracts.
 */

/** ISO-like timestamp from AllExceptionsFilter / ValidationFilter */
export function expectIsoTimestamp(value: unknown): void {
  expect(value).toEqual(
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/u),
  );
}

/** Wrapped success body from ResponseInterceptor */
export function expectSuccessEnvelope(body: unknown): asserts body is {
  message: string;
  data: unknown;
} {
  expect(body).toEqual(
    expect.objectContaining({
      message: expect.any(String),
      data: expect.anything(),
    }),
  );
}

/** Organisation JSON as returned by TypeORM serialization (dates as ISO strings). */
export function expectOrganisationResource(data: unknown): void {
  expect(data).toEqual({
    id: expect.any(String),
    name: expect.any(String),
    slug: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    isDeleted: expect.any(Boolean),
    deletedAt: null,
  });
}

export interface IStandardHttpErrorExpectation {
  statusCode: number;
  /** Exact message or regex */
  message: string | RegExp;
  /** Exact path string or pattern (routes may encode params) */
  path: string | RegExp;
  /** Nest adds this for several status codes (e.g. Conflict, Not Found); omit when not sent */
  error?: string;
}

/** Error body shaped by Nest HttpException plus AllExceptionsFilter (timestamp, path, requestId). */
export function expectFilteredHttpExceptionBody(
  body: Record<string, unknown>,
  exp: IStandardHttpErrorExpectation,
): void {
  expect(body.statusCode).toBe(exp.statusCode);

  if (typeof exp.message === 'string') {
    expect(body.message).toBe(exp.message);
  } else {
    expect(body.message).toEqual(expect.stringMatching(exp.message));
  }

  if (typeof exp.path === 'string') {
    expect(body.path).toBe(exp.path);
  } else {
    expect(body.path).toEqual(expect.stringMatching(exp.path));
  }

  expectIsoTimestamp(body.timestamp);
  expect(body.requestId).toEqual(expect.any(String));

  if (exp.error !== undefined) {
    expect(body.error).toBe(exp.error);
  }
}

/** ValidationFilter payload (422) plus optional requestId */
export function expectValidationErrorBody(
  body: Record<string, unknown>,
  path: string,
): void {
  expect(body).toEqual({
    statusCode: 422,
    message: 'Validation Error',
    errors: expect.any(Object),
    path,
    timestamp: expect.any(String),
    requestId: expect.any(String),
  });
  expectIsoTimestamp(body.timestamp);
}
