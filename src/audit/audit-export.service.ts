import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { buildPaginationMeta } from '../common/pagination/build-pagination-meta.js';
import { PaginatedResult } from '../common/pagination/paginated-result.js';

import { auditEntriesToCsv } from './audit-csv.util.js';
import {
  AuditExportQueryDto,
  AuditLogEntryDto,
} from './dto/audit-export-query.dto.js';
import { AuditLogEntry } from './entities/audit-log-entry.entity.js';
import { AuditExportFormat } from './enums/audit-export-format.enum.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import type { IPaginationMeta } from '../common/pagination/pagination-meta.interface.js';

export type AuditExportJsonResult = PaginatedResult<AuditLogEntryDto>;

export type AuditExportCsvResult = {
  csv: string;
  meta: IPaginationMeta;
};

export type AuditExportResult = AuditExportJsonResult | AuditExportCsvResult;

@Injectable()
export class AuditExportService {
  constructor(
    @InjectRepository(AuditLogEntry)
    private readonly auditRepo: Repository<AuditLogEntry>,
  ) {}

  async export(
    user: AuthenticatedUser,
    query: AuditExportQueryDto,
  ): Promise<AuditExportResult> {
    const organisationId = user.organisationId;
    if (!organisationId) {
      throw new ForbiddenException('No active organisation context');
    }

    const page = query.page;
    const perPage = query.perPage;
    const skip = (page - 1) * perPage;

    const qb = this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.organisationId = :organisationId', { organisationId })
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(perPage);

    if (query.entityType) {
      qb.andWhere('audit.entityType = :entityType', {
        entityType: query.entityType,
      });
    }

    if (query.action) {
      qb.andWhere('audit.action = :action', { action: query.action });
    }

    if (query.from) {
      qb.andWhere('audit.createdAt >= :from', { from: query.from });
    }

    if (query.to) {
      qb.andWhere('audit.createdAt <= :to', { to: query.to });
    }

    const [rows, total] = await qb.getManyAndCount();
    const items = rows.map((row) => this.toDto(row));
    const meta = buildPaginationMeta({ total, page, perPage });

    if (query.format === AuditExportFormat.CSV) {
      return {
        csv: auditEntriesToCsv(items),
        meta,
      };
    }

    return new PaginatedResult(items, meta);
  }

  private toDto(row: AuditLogEntry): AuditLogEntryDto {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      actorUserId: row.actorUserId,
      organisationId: row.organisationId,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action,
      changes: row.changes,
    };
  }
}
