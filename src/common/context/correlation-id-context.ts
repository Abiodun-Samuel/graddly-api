import { AsyncLocalStorage } from 'async_hooks';

import type { Request } from 'express';

export interface ICorrelationIdStore {
  correlationId: string;
}

const storage = new AsyncLocalStorage<ICorrelationIdStore>();

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

/** Prefer AsyncLocalStorage; fallback for code outside the request ALS callback. */
export function getRequestId(request: Request): string | undefined {
  const fromStore = getCorrelationId();
  if (fromStore) {
    return fromStore;
  }
  const header = request.get('x-request-id');
  return typeof header === 'string' && header.trim() !== ''
    ? header.trim()
    : undefined;
}

export function runWithCorrelationId<T>(
  correlationId: string,
  callback: () => T,
): T {
  return storage.run({ correlationId }, callback);
}
