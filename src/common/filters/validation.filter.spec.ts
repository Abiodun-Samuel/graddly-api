import { ArgumentsHost } from '@nestjs/common';

import * as correlationContext from '../context/correlation-id-context.js';
import { ValidationException } from '../exceptions/validation.exception.js';

import { ValidationFilter } from './validation.filter.js';

import type { Request, Response } from 'express';

function firstJsonBody(mockJson: jest.Mock): Record<string, unknown> {
  const calls = mockJson.mock.calls as unknown[][];
  const payload = calls[0]?.[0];
  expect(payload !== undefined && typeof payload === 'object').toBe(true);
  return payload as Record<string, unknown>;
}

describe('ValidationFilter', () => {
  let filter: ValidationFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: Response;
  let getRequestIdSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new ValidationFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus } as unknown as Response;
    getRequestIdSpy = jest
      .spyOn(correlationContext, 'getRequestId')
      .mockReturnValue(undefined);
  });

  afterEach(() => {
    getRequestIdSpy.mockRestore();
    jest.restoreAllMocks();
  });

  function mockHost(request: Partial<Request>): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => request,
      }),
    } as ArgumentsHost;
  }

  it('includes requestId when getRequestId returns a value', () => {
    getRequestIdSpy.mockReturnValue('val-422');

    const exception = new ValidationException({ email: 'invalid' });
    filter.catch(
      exception,
      mockHost({ url: '/api/v1/auth/signup', method: 'POST' }),
    );

    expect(firstJsonBody(mockJson)).toMatchObject({
      statusCode: 422,
      message: 'Validation Error',
      errors: { email: 'invalid' },
      requestId: 'val-422',
    });
  });

  it('omits requestId when getRequestId returns undefined', () => {
    const exception = new ValidationException({ email: 'invalid' });
    filter.catch(exception, mockHost({ url: '/x', method: 'POST' }));

    expect(firstJsonBody(mockJson)).not.toHaveProperty('requestId');
  });
});
