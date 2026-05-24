import {
  AUDIT_EXCLUDED_FIELDS,
  AUDIT_RELATION_FIELDS,
} from './audit.constants.js';

import type { AuditChanges } from './entities/audit-log-entry.entity.js';

function serializeAuditValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function isAuditableScalar(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (value instanceof Date) {
    return true;
  }
  const valueType = typeof value;
  return (
    valueType === 'string' ||
    valueType === 'number' ||
    valueType === 'boolean' ||
    valueType === 'bigint'
  );
}

function toRecord(entity: object): Record<string, unknown> {
  return entity as Record<string, unknown>;
}

function shouldSkipField(key: string, value: unknown): boolean {
  if (AUDIT_EXCLUDED_FIELDS.has(key) || AUDIT_RELATION_FIELDS.has(key)) {
    return true;
  }
  return !isAuditableScalar(value);
}

export function buildInsertChanges(entity: object): AuditChanges {
  const record = toRecord(entity);
  const changes: AuditChanges = {};

  for (const [key, value] of Object.entries(record)) {
    if (shouldSkipField(key, value) || value === undefined) {
      continue;
    }
    changes[key] = { to: serializeAuditValue(value) };
  }

  return changes;
}

export function buildUpdateChanges(
  before: object,
  after: object,
): AuditChanges {
  const beforeRecord = toRecord(before);
  const afterRecord = toRecord(after);
  const changes: AuditChanges = {};
  const keys = new Set([
    ...Object.keys(beforeRecord),
    ...Object.keys(afterRecord),
  ]);

  for (const key of keys) {
    if (
      shouldSkipField(key, beforeRecord[key]) &&
      shouldSkipField(key, afterRecord[key])
    ) {
      continue;
    }

    const fromValue = beforeRecord[key];
    const toValue = afterRecord[key];

    if (Object.is(fromValue, toValue)) {
      continue;
    }

    if (!isAuditableScalar(fromValue) || !isAuditableScalar(toValue)) {
      continue;
    }

    changes[key] = {
      from: serializeAuditValue(fromValue),
      to: serializeAuditValue(toValue),
    };
  }

  return changes;
}

export function buildDeleteChanges(
  before: object,
  after: object,
): AuditChanges {
  const changes = buildUpdateChanges(before, after);
  changes.isDeleted = { from: false, to: true };
  return changes;
}
