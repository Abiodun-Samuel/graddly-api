import { AsyncLocalStorage } from 'async_hooks';

import type { Request } from 'express';

export interface ICorrelationIdStore {
  correlationId: string;
  /** Active organisation UUID for optional Postgres RLS session var; set by ActiveOrganisationGuard. */
  currentOrganisationId?: string;
}

const storage = new AsyncLocalStorage<ICorrelationIdStore>();

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

export function getCurrentOrganisationId(): string | undefined {
  return storage.getStore()?.currentOrganisationId;
}

export function setCurrentOrganisationId(id: string | undefined): void {
  const store = storage.getStore();
  if (store) {
    store.currentOrganisationId = id;
  }
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
  correlationIdOrStore: string | ICorrelationIdStore,
  callback: () => T,
): T {
  const store: ICorrelationIdStore =
    typeof correlationIdOrStore === 'string'
      ? { correlationId: correlationIdOrStore }
      : correlationIdOrStore;
  return storage.run(store, callback);
}
