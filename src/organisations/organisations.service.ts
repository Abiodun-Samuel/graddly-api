import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { setCurrentUserId } from '../common/context/correlation-id-context.js';
import { setLastKnownUserIdForGuc } from '../database/apply-tenant-gucs.js';

import { CreateOrganisationDto } from './dto/create-organisation.dto.js';
import { UpdateOrganisationDto } from './dto/update-organisation.dto.js';
import { OrganisationMembership } from './entities/organisation-membership.entity.js';
import { Organisation } from './entities/organisation.entity.js';
import { OrganisationRole } from './organisation-role.enum.js';

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectRepository(Organisation)
    private readonly organisationsRepository: Repository<Organisation>,
    @InjectRepository(OrganisationMembership)
    private readonly membershipRepository: Repository<OrganisationMembership>,
  ) {}

  async create(
    dto: CreateOrganisationDto,
    creatorUserId: string,
  ): Promise<Organisation> {
    setCurrentUserId(creatorUserId);
    setLastKnownUserIdForGuc(creatorUserId);

    const slug = normalizeSlug(dto.slug);
    const existing = await this.organisationsRepository.findOne({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(
        'An organisation with this slug already exists',
      );
    }

    const id = randomUUID();
    const name = dto.name.trim();

    // INSERT without RETURNING: RLS SELECT policies block RETURNING until membership exists.
    await this.organisationsRepository.manager.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO organisations (id, name, slug) VALUES ($1, $2, $3)`,
        [id, name, slug],
      );

      const membership = manager.getRepository(OrganisationMembership).create({
        organisation: { id },
        user: { id: creatorUserId },
        role: OrganisationRole.OWNER,
      });
      await manager.getRepository(OrganisationMembership).save(membership);
    });

    return this.findOne(id);
  }

  async findAll(): Promise<Organisation[]> {
    return this.organisationsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Organisation> {
    const organisation = await this.organisationsRepository.findOne({
      where: { id },
    });
    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
    return organisation;
  }

  async update(id: string, dto: UpdateOrganisationDto): Promise<Organisation> {
    const organisation = await this.findOne(id);

    const nextName =
      dto.name !== undefined ? dto.name.trim() : organisation.name;
    let nextSlug = organisation.slug;

    if (dto.slug !== undefined) {
      nextSlug = normalizeSlug(dto.slug);
      if (nextSlug !== organisation.slug) {
        const clash = await this.organisationsRepository.findOne({
          where: { slug: nextSlug },
        });
        if (clash && clash.id !== organisation.id) {
          throw new ConflictException(
            'An organisation with this slug already exists',
          );
        }
      }
    }

    organisation.name = nextName;
    organisation.slug = nextSlug;
    return this.organisationsRepository.save(organisation);
  }

  async remove(id: string): Promise<void> {
    const organisation = await this.findOne(id);
    await this.organisationsRepository.softRemove(organisation);
  }
}
