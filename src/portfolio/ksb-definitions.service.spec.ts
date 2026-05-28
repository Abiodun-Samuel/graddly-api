import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Standard } from '../programmes/entities/standard.entity.js';

import { KsbDefinition } from './entities/ksb-definition.entity.js';
import { KsbKind } from './enums/ksb-kind.enum.js';
import { KsbDefinitionsService } from './ksb-definitions.service.js';

describe('KsbDefinitionsService', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((v: unknown) => v),
    save: jest.fn((v: { id?: string }) => ({ id: 'ksb-1', ...v })),
    find: jest.fn(),
  };
  const standardRepo = {
    findOne: jest.fn().mockResolvedValue({ id: 'std-1' }),
  };

  let service: KsbDefinitionsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        KsbDefinitionsService,
        { provide: getRepositoryToken(KsbDefinition), useValue: repo },
        { provide: getRepositoryToken(Standard), useValue: standardRepo },
      ],
    }).compile();
    service = moduleRef.get(KsbDefinitionsService);
    jest.clearAllMocks();
    standardRepo.findOne.mockResolvedValue({ id: 'std-1' });
    repo.findOne.mockResolvedValue(null);
  });

  const user = {
    id: 'u1',
    organisationId: 'org-1',
    email: 'a@example.com',
    roles: ['owner'],
  } as const;

  it('creates a KSB definition', async () => {
    const result = await service.createForStandard(user, 'std-1', {
      code: 'K1',
      kind: KsbKind.KNOWLEDGE,
      title: 'Knowledge 1',
    });
    expect(result.code).toBe('K1');
    expect(repo.save).toHaveBeenCalled();
  });

  it('rejects duplicate code', async () => {
    repo.findOne.mockResolvedValue({ id: 'existing' });
    await expect(
      service.createForStandard(user, 'std-1', {
        code: 'K1',
        kind: KsbKind.KNOWLEDGE,
        title: 'Dup',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
