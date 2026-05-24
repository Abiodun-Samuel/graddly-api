import { Organisation } from '../organisations/entities/organisation.entity.js';

import { AuditLogSubscriber } from './audit-log.subscriber.js';
import { AuditAction } from './enums/audit-action.enum.js';

import type { InsertEvent, UpdateEvent } from 'typeorm';

jest.mock('../common/context/correlation-id-context.js', () => ({
  getCurrentUserId: jest.fn(() => 'actor-1'),
  getRlsBootstrap: jest.fn(() => false),
  setRlsBootstrap: jest.fn(),
}));

describe('AuditLogSubscriber', () => {
  const subscriber = new AuditLogSubscriber();
  const insert = jest.fn();

  const manager = { insert };

  beforeEach(() => {
    insert.mockReset();
  });

  it('afterInsert writes audit row for audited entities', async () => {
    const entity = Object.assign(new Organisation(), {
      id: 'org-1',
      name: 'Acme',
      slug: 'acme',
    });

    const event = {
      entity,
      metadata: { tableName: 'organisations' },
      manager,
    } as unknown as InsertEvent<object>;

    await subscriber.afterInsert(event);

    expect(insert).toHaveBeenCalledTimes(1);
    const calls = insert.mock.calls as [
      unknown,
      {
        actorUserId: string;
        organisationId: string;
        entityType: string;
        entityId: string;
        action: AuditAction;
        changes: Record<string, { to: string }>;
      },
    ][];
    const row = calls[0][1];

    expect(row).toMatchObject({
      actorUserId: 'actor-1',
      organisationId: 'org-1',
      entityType: 'organisations',
      entityId: 'org-1',
      action: AuditAction.INSERT,
    });
    expect(row.changes.name).toEqual({ to: 'Acme' });
    expect(row.changes.slug).toEqual({ to: 'acme' });
  });

  it('afterInsert skips non-audited entities', async () => {
    const event = {
      entity: { id: 'x', constructor: Object },
      metadata: { tableName: 'users' },
      manager,
    } as unknown as InsertEvent<object>;

    await subscriber.afterInsert(event);

    expect(insert).not.toHaveBeenCalled();
  });

  it('afterUpdate skips when there are no scalar changes', async () => {
    const entity = Object.assign(new Organisation(), {
      id: 'org-1',
      name: 'Acme',
      slug: 'acme',
    });

    const event = {
      entity,
      databaseEntity: { ...entity },
      metadata: { tableName: 'organisations' },
      manager,
    } as unknown as UpdateEvent<object>;

    await subscriber.afterUpdate(event);

    expect(insert).not.toHaveBeenCalled();
  });
});
