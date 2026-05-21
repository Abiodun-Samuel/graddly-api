import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { OrganisationMembership } from './entities/organisation-membership.entity.js';
import { Organisation } from './entities/organisation.entity.js';
import { MembershipStatus } from './membership-status.enum.js';
import { OrganisationRole } from './organisation-role.enum.js';
import { OrganisationsService } from './organisations.service.js';

const baseOrgDto = {
  name: 'Acme Trust',
  ukprn: '10012345',
  address: '1 Training Lane',
  city: 'London',
  postcode: 'SW1A 1AA',
  country: 'United Kingdom',
  orgEmail: 'info@acme.co.uk',
} as const;

describe('OrganisationsService', () => {
  let service: OrganisationsService;
  let repository: jest.Mocked<
    Pick<Repository<Organisation>, 'find' | 'findOne' | 'save' | 'softRemove'> & {
      createQueryBuilder: jest.Mock;
    }
  >;
  let mockManager: jest.Mocked<Pick<EntityManager, 'create' | 'save'>>;
  let mockDataSource: { transaction: jest.Mock };
  let mockQueryBuilder: {
    select: jest.Mock;
    where: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockManager = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation(
        (cb: (manager: typeof mockManager) => Promise<unknown>) => cb(mockManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationsService,
        { provide: getRepositoryToken(Organisation), useValue: repository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(OrganisationsService);
  });

  describe('create', () => {
    it('auto-generates slug from name and creates org + membership in a transaction', async () => {
      // generateUniqueSlug: no existing slugs
      mockQueryBuilder.getMany.mockResolvedValue([]);
      // UKPRN uniqueness check
      repository.findOne.mockResolvedValueOnce(null);

      const orgEntity = { id: 'org-1', name: 'Acme Trust', slug: 'acme-trust' } as Organisation;
      const membershipEntity = {} as OrganisationMembership;
      mockManager.create
        .mockReturnValueOnce(orgEntity as never)
        .mockReturnValueOnce(membershipEntity as never);
      mockManager.save
        .mockResolvedValueOnce(orgEntity as unknown)
        .mockResolvedValueOnce(membershipEntity as unknown);

      const result = await service.create(baseOrgDto, 'user-1');

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.create).toHaveBeenNthCalledWith(1, Organisation, {
        name: 'Acme Trust',
        slug: 'acme-trust',
        portalType: null,
        ukprn: '10012345',
        address: '1 Training Lane',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
        orgEmail: 'info@acme.co.uk',
        orgPhone: null,
        website: null,
      });
      expect(mockManager.create).toHaveBeenNthCalledWith(2, OrganisationMembership, {
        user: { id: 'user-1' },
        organisation: { id: 'org-1' },
        role: OrganisationRole.OWNER,
        status: MembershipStatus.ACTIVE,
        joinedAt: expect.any(Date),
      });
      expect(result).toEqual(orgEntity);
    });

    it('appends numeric suffix when generated slug is already taken', async () => {
      // Simulate 'acme-trust' and 'acme-trust-1' both taken
      mockQueryBuilder.getMany.mockResolvedValue([
        { slug: 'acme-trust' },
        { slug: 'acme-trust-1' },
      ] as Organisation[]);
      repository.findOne.mockResolvedValueOnce(null);

      const orgEntity = { id: 'org-2', name: 'Acme Trust', slug: 'acme-trust-2' } as Organisation;
      mockManager.create.mockReturnValueOnce(orgEntity as never).mockReturnValueOnce({} as never);
      mockManager.save.mockResolvedValueOnce(orgEntity as never).mockResolvedValueOnce({} as never);

      const result = await service.create(baseOrgDto, 'user-1');

      expect(mockManager.create).toHaveBeenNthCalledWith(
        1,
        Organisation,
        expect.objectContaining({ slug: 'acme-trust-2' }),
      );
      expect(result).toEqual(orgEntity);
    });

    it('throws ConflictException when UKPRN belongs to another org', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      repository.findOne.mockResolvedValueOnce({ id: 'other' } as Organisation);

      await expect(service.create(baseOrgDto, 'user-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('propagates error and rolls back when membership insert fails', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      repository.findOne.mockResolvedValueOnce(null);

      const orgEntity = { id: 'org-1', name: 'Acme Trust', slug: 'acme-trust' } as Organisation;
      mockManager.create
        .mockReturnValueOnce(orgEntity as never)
        .mockReturnValueOnce({} as never);
      mockManager.save
        .mockResolvedValueOnce(orgEntity as never)
        .mockRejectedValueOnce(new Error('DB constraint violation'));

      await expect(service.create(baseOrgDto, 'user-1')).rejects.toThrow(
        'DB constraint violation',
      );
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
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws ConflictException when new UKPRN belongs to another org', async () => {
      const existing = { id: 'org-1', name: 'A', slug: 'a', ukprn: '11111111' } as Organisation;
      const other = { id: 'org-2', ukprn: '22222222' } as Organisation;
      repository.findOne
        .mockResolvedValueOnce(existing)  // findOne in findOne()
        .mockResolvedValueOnce(other);    // UKPRN clash check

      await expect(
        service.update('org-1', { ukprn: '22222222' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updates fields when payload is valid', async () => {
      const existing = {
        id: 'org-1',
        name: 'Old Name',
        slug: 'old-name',
        city: 'Manchester',
      } as Organisation;
      repository.findOne.mockResolvedValueOnce(existing);
      repository.save.mockImplementation((o: Organisation) => Promise.resolve(o));

      const result = await service.update('org-1', { name: 'New Name', city: 'London' });

      expect(result.name).toBe('New Name');
      expect(result.city).toBe('London');
      expect(result.slug).toBe('old-name'); // slug unchanged
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
