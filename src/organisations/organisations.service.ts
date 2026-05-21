import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { setCurrentUserId } from '../common/context/correlation-id-context.js';
import { setLastKnownUserIdForGuc } from '../database/apply-tenant-gucs.js';

import { CreateOrganisationDto } from './dto/create-organisation.dto.js';
import { UpdateOrganisationDto } from './dto/update-organisation.dto.js';
import { OrganisationMembership } from './entities/organisation-membership.entity.js';
import { Organisation } from './entities/organisation.entity.js';
<<<<<<< HEAD
import { MembershipStatus } from './membership-status.enum.js';
=======
>>>>>>> e35608a910d82e97ae3a7c6d358766c3bb7910c6
import { OrganisationRole } from './organisation-role.enum.js';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectRepository(Organisation)
    private readonly organisationsRepository: Repository<Organisation>,
<<<<<<< HEAD
    private readonly dataSource: DataSource,
  ) {}

  private async generateUniqueSlug(base: string): Promise<string> {
    const slug = toSlug(base);
    const taken = await this.organisationsRepository
      .createQueryBuilder('o')
      .select('o.slug')
      .where('o.slug = :slug OR o.slug LIKE :pattern', {
        slug,
        pattern: `${slug}-%`,
      })
      .getMany()
      .then((rows) => new Set(rows.map((r) => r.slug)));

    if (!taken.has(slug)) return slug;
    let n = 1;
    while (taken.has(`${slug}-${n}`)) n++;
    return `${slug}-${n}`;
  }

  async create(dto: CreateOrganisationDto, creatorId: string): Promise<Organisation> {
    const slug = await this.generateUniqueSlug(dto.name);

    if (dto.ukprn) {
      const ukprnTaken = await this.organisationsRepository.findOne({
        where: { ukprn: dto.ukprn },
      });
      if (ukprnTaken) {
        throw new ConflictException('An organisation with this UKPRN already exists');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const org = manager.create(Organisation, {
        name: dto.name.trim(),
        slug,
        portalType: dto.portalType ?? null,
        ukprn: dto.ukprn ?? null,
        address: dto.address.trim(),
        city: dto.city.trim(),
        postcode: dto.postcode,
        country: dto.country.trim(),
        orgEmail: dto.orgEmail.trim(),
        orgPhone: dto.orgPhone?.trim() || null,
        website: dto.website?.trim() || null,
      });
      const savedOrg = await manager.save(org);

      const membership = manager.create(OrganisationMembership, {
        user: { id: creatorId },
        organisation: { id: savedOrg.id },
        role: OrganisationRole.OWNER,
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
      });
      await manager.save(membership);

      return savedOrg;
    });
=======
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
>>>>>>> e35608a910d82e97ae3a7c6d358766c3bb7910c6
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

    if (dto.name !== undefined) organisation.name = dto.name.trim();
    if (dto.portalType !== undefined) organisation.portalType = dto.portalType ?? null;
    if (dto.ukprn !== undefined) {
      if (dto.ukprn !== organisation.ukprn) {
        const clash = await this.organisationsRepository.findOne({
          where: { ukprn: dto.ukprn },
        });
        if (clash && clash.id !== organisation.id) {
          throw new ConflictException('An organisation with this UKPRN already exists');
        }
      }
      organisation.ukprn = dto.ukprn;
    }
    if (dto.address !== undefined) organisation.address = dto.address.trim();
    if (dto.city !== undefined) organisation.city = dto.city.trim();
    if (dto.postcode !== undefined) organisation.postcode = dto.postcode;
    if (dto.country !== undefined) organisation.country = dto.country.trim();
    if (dto.orgEmail !== undefined) organisation.orgEmail = dto.orgEmail.trim();
    if (dto.orgPhone !== undefined) organisation.orgPhone = dto.orgPhone?.trim() || null;
    if (dto.website !== undefined) organisation.website = dto.website?.trim() || null;

    return this.organisationsRepository.save(organisation);
  }

  async remove(id: string): Promise<void> {
    const organisation = await this.findOne(id);
    await this.organisationsRepository.softRemove(organisation);
  }
}
