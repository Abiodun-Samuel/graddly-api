import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrganisationMembership } from './entities/organisation-membership.entity.js';
import { Organisation } from './entities/organisation.entity.js';
import { OrganisationRole } from './organisation-role.enum.js';
import { OrganisationsService } from './organisations.service.js';

describe('OrganisationsService', () => {
  let service: OrganisationsService;
  let repository: jest.Mocked<
    Pick<
      Repository<Organisation>,
      'create' | 'save' | 'find' | 'findOne' | 'softRemove' | 'manager'
    >
  >;
  let membershipRepository: jest.Mocked<
    Pick<Repository<OrganisationMembership>, 'create' | 'save'>
  >;
  let transactionQuery: jest.Mock;
  let transactionMock: jest.Mock;
  let transactionMembershipRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    transactionQuery = jest.fn().mockResolvedValue(undefined);
    transactionMembershipRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    transactionMock = jest.fn(
      async (work: (manager: unknown) => Promise<void>) => {
        await work({
          query: transactionQuery,
          getRepository: () => transactionMembershipRepo,
        });
      },
    );

    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
      manager: {
        transaction: transactionMock,
      } as unknown as Repository<Organisation>['manager'],
    };
    membershipRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationsService,
        {
          provide: getRepositoryToken(Organisation),
          useValue: repository,
        },
        {
          provide: getRepositoryToken(OrganisationMembership),
          useValue: membershipRepository,
        },
      ],
    }).compile();

    service = module.get(OrganisationsService);
  });

  describe('create', () => {
    it('creates when slug is free', async () => {
      const entity = {
        id: 'org-1',
        name: 'Acme',
        slug: 'acme',
      } as Organisation;
      repository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(entity);
      const membership = {
        id: 'mem-1',
        role: OrganisationRole.OWNER,
      } as OrganisationMembership;
      transactionMembershipRepo.create.mockReturnValue(membership);
      transactionMembershipRepo.save.mockResolvedValue(membership);

      const result = await service.create(
        {
          name: 'Acme',
          slug: 'Acme',
        },
        'user-creator',
      );

      expect(repository.findOne).toHaveBeenNthCalledWith(1, {
        where: { slug: 'acme' },
      });
      expect(transactionQuery).toHaveBeenCalledWith(
        `INSERT INTO organisations (id, name, slug) VALUES ($1, $2, $3)`,
        [expect.any(String), 'Acme', 'acme'],
      );
      expect(transactionMembershipRepo.create).toHaveBeenCalledTimes(1);
      const createCalls = transactionMembershipRepo.create.mock.calls as [
        [
          {
            organisation: { id: string };
            user: { id: string };
            role: OrganisationRole;
          },
        ],
      ];
      const createArg = createCalls[0][0];
      expect(createArg.organisation.id).toEqual(expect.any(String));
      expect(createArg.user).toEqual({ id: 'user-creator' });
      expect(createArg.role).toBe(OrganisationRole.OWNER);
      expect(result).toEqual(entity);
    });

    it('throws ConflictException when slug exists', async () => {
      repository.findOne.mockResolvedValueOnce({ id: 'x' } as Organisation);

      await expect(
        service.create({ name: 'A', slug: 'taken-slug' }, 'user-creator'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(transactionMock).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns organisation when found', async () => {
      const org = { id: 'org-1', name: 'A', slug: 'a' } as Organisation;
      repository.findOne.mockResolvedValueOnce(org);

      await expect(service.findOne('org-1')).resolves.toEqual(org);
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws ConflictException when new slug belongs to another org', async () => {
      const existing = {
        id: 'org-1',
        name: 'A',
        slug: 'alpha',
      } as Organisation;
      const other = {
        id: 'org-2',
        name: 'B',
        slug: 'beta',
      } as Organisation;

      repository.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(other);

      await expect(
        service.update('org-1', { slug: 'beta' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates when slug unchanged', async () => {
      const existing = {
        id: 'org-1',
        name: 'Old',
        slug: 'same',
      } as Organisation;
      repository.findOne.mockResolvedValueOnce(existing);
      repository.save.mockImplementation((o: Organisation) =>
        Promise.resolve(o),
      );

      const result = await service.update('org-1', { name: 'New' });

      expect(result.name).toBe('New');
      expect(result.slug).toBe('same');
    });
  });

  describe('remove', () => {
    it('soft-removes organisation', async () => {
      const org = { id: 'org-1', name: 'A', slug: 'a' } as Organisation;
      repository.findOne.mockResolvedValueOnce(org);
      repository.softRemove.mockResolvedValueOnce(org);

      await service.remove('org-1');

      expect(repository.softRemove).toHaveBeenCalledWith(org);
    });
  });
});
