import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organisation } from './entities/organisation.entity.js';
import { OrganisationsService } from './organisations.service.js';

describe('OrganisationsService', () => {
  let service: OrganisationsService;
  let repository: jest.Mocked<
    Pick<
      Repository<Organisation>,
      'create' | 'save' | 'find' | 'findOne' | 'softRemove'
    >
  >;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationsService,
        {
          provide: getRepositoryToken(Organisation),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(OrganisationsService);
  });

  describe('create', () => {
    it('creates when slug is free', async () => {
      repository.findOne.mockResolvedValueOnce(null);
      const entity = {
        id: 'org-1',
        name: 'Acme',
        slug: 'acme',
      } as Organisation;
      repository.create.mockReturnValue(entity);
      repository.save.mockResolvedValue(entity);

      const result = await service.create({
        name: 'Acme',
        slug: 'Acme',
      });

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { slug: 'acme' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Acme',
        slug: 'acme',
      });
      expect(result).toEqual(entity);
    });

    it('throws ConflictException when slug exists', async () => {
      repository.findOne.mockResolvedValueOnce({ id: 'x' } as Organisation);

      await expect(
        service.create({ name: 'A', slug: 'taken-slug' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
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
