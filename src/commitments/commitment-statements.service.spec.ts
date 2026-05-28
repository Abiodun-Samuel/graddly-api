import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Enrolment } from '../enrolments/entities/enrolment.entity.js';
import { PdfDispatchService } from '../pdf/pdf-dispatch.service.js';

import { CommitmentStatementStatusService } from './commitment-statement-status.service.js';
import { CommitmentStatementsService } from './commitment-statements.service.js';
import { CommitmentStatementGroup } from './entities/commitment-statement-group.entity.js';
import { CommitmentStatement } from './entities/commitment-statement.entity.js';
import { CommitmentStatementStatus } from './enums/commitment-statement-status.enum.js';

describe('CommitmentStatementsService', () => {
  const groupRepo = {
    findOne: jest.fn(),
    create: jest.fn((v: unknown) => v),
    save: jest.fn((v: { id?: string }) => ({ id: 'group-1', ...v })),
  };
  const statementRepo = {
    findOne: jest.fn(),
    create: jest.fn((v: unknown) => v),
    save: jest.fn((v: { id?: string; version?: number }) => ({
      id: v.id ?? `stmt-${v.version ?? 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishedByUserId: null,
      supersededAt: null,
      snapshotPdfJobId: null,
      finalSignedPdfKey: null,
      status: CommitmentStatementStatus.DRAFT,
      organisationId: 'org-1',
      groupId: 'group-1',
      ...v,
    })),
  };
  const enrolmentRepo = {
    findOne: jest.fn().mockResolvedValue({
      id: 'enr-1',
      apprenticeId: 'app-1',
    }),
  };
  const pdfDispatch = { enqueue: jest.fn() };

  let service: CommitmentStatementsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CommitmentStatementsService,
        CommitmentStatementStatusService,
        {
          provide: getRepositoryToken(CommitmentStatementGroup),
          useValue: groupRepo,
        },
        {
          provide: getRepositoryToken(CommitmentStatement),
          useValue: statementRepo,
        },
        { provide: getRepositoryToken(Enrolment), useValue: enrolmentRepo },
        { provide: PdfDispatchService, useValue: pdfDispatch },
      ],
    }).compile();

    service = moduleRef.get(CommitmentStatementsService);
    jest.clearAllMocks();
    groupRepo.findOne.mockResolvedValue(null);
    enrolmentRepo.findOne.mockResolvedValue({
      id: 'enr-1',
      apprenticeId: 'app-1',
    });
  });

  const user = {
    id: 'user-1',
    organisationId: 'org-1',
    email: 'o@example.com',
    roles: ['owner'],
  } as const;

  const content = {
    trainingPlanSummary: 'Plan',
    employerCommitments: 'Employer',
    apprenticeCommitments: 'Apprentice',
    providerCommitments: 'Provider',
  };

  it('creates group and version 1', async () => {
    const result = await service.create(user, {
      enrolmentId: 'enr-1',
      apprenticeId: 'app-1',
      content,
      apprenticeUserId: 'u1',
      tutorUserId: 'u2',
      employerManagerUserId: 'u3',
    });
    expect(result.version).toBe(1);
    expect(result.status).toBe(CommitmentStatementStatus.DRAFT);
    expect(groupRepo.save).toHaveBeenCalled();
  });

  it('rejects duplicate group per enrolment', async () => {
    groupRepo.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create(user, {
        enrolmentId: 'enr-1',
        apprenticeId: 'app-1',
        content,
        apprenticeUserId: 'u1',
        tutorUserId: 'u2',
        employerManagerUserId: 'u3',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects version bump while draft', async () => {
    groupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      enrolmentId: 'enr-1',
      apprenticeId: 'app-1',
      currentVersionId: 'stmt-1',
      isDeleted: false,
    });
    statementRepo.findOne.mockResolvedValue({
      id: 'stmt-1',
      version: 1,
      status: CommitmentStatementStatus.DRAFT,
      groupId: 'group-1',
      organisationId: 'org-1',
    });

    await expect(
      service.createVersion(user, 'group-1', {
        enrolmentId: 'enr-1',
        apprenticeId: 'app-1',
        content,
        apprenticeUserId: 'u1',
        tutorUserId: 'u2',
        employerManagerUserId: 'u3',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
