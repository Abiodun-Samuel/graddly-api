import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateOrganisationDto } from './dto/create-organisation.dto.js';
import { UpdateOrganisationDto } from './dto/update-organisation.dto.js';
import { Organisation } from './entities/organisation.entity.js';

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectRepository(Organisation)
    private readonly organisationsRepository: Repository<Organisation>,
  ) {}

  async create(dto: CreateOrganisationDto): Promise<Organisation> {
    const slug = normalizeSlug(dto.slug);
    const existing = await this.organisationsRepository.findOne({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException(
        'An organisation with this slug already exists',
      );
    }

    const organisation = this.organisationsRepository.create({
      name: dto.name.trim(),
      slug,
    });
    return this.organisationsRepository.save(organisation);
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
