import { auditEntriesToCsv, escapeCsvField } from './audit-csv.util.js';
import { AuditAction } from './enums/audit-action.enum.js';

describe('audit-csv.util', () => {
  it('escapeCsvField quotes fields with commas and quotes', () => {
    expect(escapeCsvField('hello')).toBe('hello');
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('auditEntriesToCsv renders header and rows', () => {
    const csv = auditEntriesToCsv([
      {
        id: 'entry-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        actorUserId: 'user-1',
        organisationId: 'org-1',
        entityType: 'invitations',
        entityId: 'inv-1',
        action: AuditAction.INSERT,
        changes: { email: { to: 'a@example.com' } },
      },
    ]);

    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('entry-1');
    expect(csv).toContain('invitations');
  });
});
