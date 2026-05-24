import {
  buildDeleteChanges,
  buildInsertChanges,
  buildUpdateChanges,
} from './audit-changes.util.js';

describe('audit-changes.util', () => {
  it('buildInsertChanges records scalar fields and skips secrets and relations', () => {
    const changes = buildInsertChanges({
      id: 'id-1',
      email: 'a@example.com',
      passwordHash: 'secret',
      organisation: { id: 'org-1' },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'admin',
    });

    expect(changes).toEqual({
      email: { to: 'a@example.com' },
      role: { to: 'admin' },
    });
  });

  it('buildUpdateChanges records only changed scalar fields', () => {
    const changes = buildUpdateChanges(
      { email: 'old@example.com', role: 'member' },
      { email: 'new@example.com', role: 'member' },
    );

    expect(changes).toEqual({
      email: { from: 'old@example.com', to: 'new@example.com' },
    });
  });

  it('buildDeleteChanges includes isDeleted flag and other changes', () => {
    const changes = buildDeleteChanges(
      { email: 'a@example.com', isDeleted: false },
      { email: 'a@example.com', isDeleted: true, deletedAt: new Date() },
    );

    expect(changes.isDeleted).toEqual({ from: false, to: true });
  });
});
