import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));
import * as Sentry from '@sentry/nestjs';

import * as correlationContext from '../context/correlation-id-context.js';

import { AllExceptionsFilter } from './all-exceptions.filter.js';

import type { Request, Response } from 'express';

function firstJsonBody(mockJson: jest.Mock): Record<string, unknown> {
  const calls = mockJson.mock.calls as unknown[][];
  const payload = calls[0]?.[0];
  expect(payload !== undefined && typeof payload === 'object').toBe(true);
  return payload as Record<string, unknown>;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockResponse: Response;
  let getRequestIdSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus } as unknown as Response;
    getRequestIdSpy = jest
      .spyOn(correlationContext, 'getRequestId')
      .mockReturnValue(undefined);
    jest.mocked(Sentry.captureException).mockClear();
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

  it('adds requestId to the body when getRequestId returns a value', () => {
    getRequestIdSpy.mockReturnValue('rid-99');

    filter.catch(
      new HttpException('Not Found', HttpStatus.NOT_FOUND),
      mockHost({
        url: '/missing',
        method: 'GET',
      }),
    );

    expect(firstJsonBody(mockJson)).toMatchObject({
      requestId: 'rid-99',
      path: '/missing',
    });
    expect(jest.mocked(Sentry.captureException)).not.toHaveBeenCalled();
  });

  it('calls Sentry.captureException for 5xx errors', () => {
    const err = new Error('boom');
    filter.catch(err, mockHost({ url: '/x', method: 'GET' }));

    expect(jest.mocked(Sentry.captureException)).toHaveBeenCalledWith(err);
  });

  it('calls Sentry.captureException for HttpException with status 500', () => {
    const err = new HttpException('bad', HttpStatus.INTERNAL_SERVER_ERROR);
    filter.catch(err, mockHost({ url: '/x', method: 'POST' }));

    expect(jest.mocked(Sentry.captureException)).toHaveBeenCalledWith(err);
  });

  it('does not report 4xx HttpException to Sentry', () => {
    filter.catch(
      new HttpException('bad request', HttpStatus.BAD_REQUEST),
      mockHost({ url: '/x', method: 'POST' }),
    );

    expect(jest.mocked(Sentry.captureException)).not.toHaveBeenCalled();
  });
});
