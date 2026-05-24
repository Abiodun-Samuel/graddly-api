import type { AuditLogEntryDto } from './dto/audit-export-query.dto.js';

const CSV_HEADERS = [
  'id',
  'createdAt',
  'actorUserId',
  'organisationId',
  'entityType',
  'entityId',
  'action',
  'changes',
] as const;

export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function auditEntriesToCsv(rows: AuditLogEntryDto[]): string {
  const lines = [CSV_HEADERS.join(',')];

  for (const row of rows) {
    lines.push(
      [
        row.id,
        row.createdAt,
        row.actorUserId ?? '',
        row.organisationId ?? '',
        row.entityType,
        row.entityId,
        row.action,
        JSON.stringify(row.changes),
      ]
        .map((value) => escapeCsvField(String(value)))
        .join(','),
    );
  }

  return lines.join('\n');
}
