import {
  getCorrelationId,
  getCurrentOrganisationId,
  getRequestId,
  runWithCorrelationId,
  setCurrentOrganisationId,
} from './correlation-id-context.js';

import type { Request } from 'express';

function mockRequest(headerValue: string | undefined): Pick<Request, 'get'> {
  return {
    get: jest.fn((name: string) =>
      name.toLowerCase() === 'x-request-id' ? headerValue : undefined,
    ),
  } as Pick<Request, 'get'>;
}

describe('correlation-id-context', () => {
  describe('runWithCorrelationId / getCorrelationId', () => {
    it('exposes correlation id inside the callback', () => {
      runWithCorrelationId('abc-123', () => {
        expect(getCorrelationId()).toBe('abc-123');
      });
    });

    it('does not leak correlation id outside the callback', () => {
      runWithCorrelationId('inner', () => {
        expect(getCorrelationId()).toBe('inner');
      });
      expect(getCorrelationId()).toBeUndefined();
    });

    it('isolates nested runs', () => {
      runWithCorrelationId('outer', () => {
        expect(getCorrelationId()).toBe('outer');
        runWithCorrelationId('nested', () => {
          expect(getCorrelationId()).toBe('nested');
        });
        expect(getCorrelationId()).toBe('outer');
      });
    });

    it('supports optional currentOrganisationId on the store', () => {
      runWithCorrelationId(
        { correlationId: 'c1', currentOrganisationId: 'org-a' },
        () => {
          expect(getCurrentOrganisationId()).toBe('org-a');
        },
      );
    });

    it('setCurrentOrganisationId mutates the active store', () => {
      runWithCorrelationId('c2', () => {
        expect(getCurrentOrganisationId()).toBeUndefined();
        setCurrentOrganisationId('org-b');
        expect(getCurrentOrganisationId()).toBe('org-b');
      });
    });
  });

  describe('getRequestId', () => {
    it('prefers AsyncLocalStorage over header', () => {
      const req = mockRequest('from-header');
      runWithCorrelationId('from-store', () => {
        expect(getRequestId(req as Request)).toBe('from-store');
      });
    });

    it('falls back to X-Request-Id header when outside ALS', () => {
      const req = mockRequest('header-only');
      expect(getRequestId(req as Request)).toBe('header-only');
    });

    it('returns undefined when no store and no header', () => {
      const req = mockRequest(undefined);
      expect(getRequestId(req as Request)).toBeUndefined();
    });

    it('ignores blank header values', () => {
      const req = mockRequest('   ');
      expect(getRequestId(req as Request)).toBeUndefined();
    });
  });
});
