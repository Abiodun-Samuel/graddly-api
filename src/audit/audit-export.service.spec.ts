import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PaginatedResult } from '../common/pagination/paginated-result.js';

import {
  AuditExportService,
  type AuditExportCsvResult,
} from './audit-export.service.js';
import {
  AuditExportQueryDto,
  AuditLogEntryDto,
} from './dto/audit-export-query.dto.js';
import { AuditLogEntry } from './entities/audit-log-entry.entity.js';
import { AuditAction } from './enums/audit-action.enum.js';
import { AuditExportFormat } from './enums/audit-export-format.enum.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import type { Repository } from 'typeorm';

describe('AuditExportService', () => {
  let service: AuditExportService;
  let qb: {
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  const createQueryBuilder = jest.fn();

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    createQueryBuilder.mockReturnValue(qb);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuditExportService,
        {
          provide: getRepositoryToken(AuditLogEntry),
          useValue: {
            createQueryBuilder,
          } as Pick<Repository<AuditLogEntry>, 'createQueryBuilder'>,
        },
      ],
    }).compile();

    service = moduleRef.get(AuditExportService);
  });

  const user = {
    id: 'user-1',
    organisationId: 'org-1',
  } as AuthenticatedUser;

  it('throws when active organisation is missing', async () => {
    await expect(
      service.export(
        { id: 'user-1' } as AuthenticatedUser,
        new AuditExportQueryDto(),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns paginated JSON export', async () => {
    const createdAt = new Date('2026-01-02T12:00:00.000Z');
    qb.getManyAndCount.mockResolvedValueOnce([
      [
        {
          id: 'audit-1',
          createdAt,
          actorUserId: 'user-1',
          organisationId: 'org-1',
          entityType: 'invitations',
          entityId: 'inv-1',
          action: AuditAction.INSERT,
          changes: { email: { to: 'a@example.com' } },
        },
      ],
      1,
    ]);

    const query = Object.assign(new AuditExportQueryDto(), {
      format: AuditExportFormat.JSON,
      page: 1,
      perPage: 20,
      entityType: 'invitations',
      action: AuditAction.INSERT,
    });

    const result = await service.export(user, query);

    expect(result).toBeInstanceOf(PaginatedResult);
    const paginated = result as PaginatedResult<AuditLogEntryDto>;
    expect(paginated.items[0]).toEqual(
      expect.objectContaining({
        id: 'audit-1',
        entityType: 'invitations',
        action: AuditAction.INSERT,
      }),
    );
    expect(paginated.meta.total).toBe(1);

    expect(qb.andWhere).toHaveBeenCalledWith('audit.entityType = :entityType', {
      entityType: 'invitations',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('audit.action = :action', {
      action: AuditAction.INSERT,
    });
  });

  it('returns CSV export with meta headers data', async () => {
    qb.getManyAndCount.mockResolvedValueOnce([[], 0]);

    const query = Object.assign(new AuditExportQueryDto(), {
      format: AuditExportFormat.CSV,
      page: 2,
      perPage: 10,
    });

    const result = await service.export(user, query);
    const csvResult = result as AuditExportCsvResult;

    expect(csvResult.csv).toContain('id,createdAt');
    expect(csvResult.meta.page).toBe(2);
  });
});
