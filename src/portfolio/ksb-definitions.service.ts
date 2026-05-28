import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Standard } from '../programmes/entities/standard.entity.js';

import { CreateKsbDefinitionDto } from './dto/create-ksb-definition.dto.js';
import { KsbDefinitionResponseDto } from './dto/ksb-definition-response.dto.js';
import { UpdateKsbDefinitionDto } from './dto/update-ksb-definition.dto.js';
import { KsbDefinition } from './entities/ksb-definition.entity.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@Injectable()
export class KsbDefinitionsService {
  constructor(
    @InjectRepository(KsbDefinition)
    private readonly repo: Repository<KsbDefinition>,
    @InjectRepository(Standard)
    private readonly standardRepo: Repository<Standard>,
  ) {}

  async createForStandard(
    user: AuthenticatedUser,
    standardId: string,
    dto: CreateKsbDefinitionDto,
  ): Promise<KsbDefinitionResponseDto> {
    const organisationId = user.organisationId!;
    await this.requireStandard(organisationId, standardId);

    const existing = await this.repo.findOne({
      where: { standardId, code: dto.code, isDeleted: false },
    });
    if (existing) {
      throw new ConflictException(
        `KSB code ${dto.code} already exists on this standard`,
      );
    }

    const entity = this.repo.create({
      organisationId,
      standardId,
      code: dto.code,
      kind: dto.kind,
      title: dto.title,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.toResponse(await this.repo.save(entity));
  }

  async findByStandard(
    user: AuthenticatedUser,
    standardId: string,
  ): Promise<KsbDefinitionResponseDto[]> {
    const organisationId = user.organisationId!;
    await this.requireStandard(organisationId, standardId);

    const rows = await this.repo.find({
      where: { organisationId, standardId, isDeleted: false },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateKsbDefinitionDto,
  ): Promise<KsbDefinitionResponseDto> {
    const row = await this.findEntity(user, id);

    if (dto.code !== undefined && dto.code !== row.code) {
      const clash = await this.repo.findOne({
        where: {
          standardId: row.standardId,
          code: dto.code,
          isDeleted: false,
        },
      });
      if (clash && clash.id !== row.id) {
        throw new ConflictException(
          `KSB code ${dto.code} already exists on this standard`,
        );
      }
      row.code = dto.code;
    }
    if (dto.kind !== undefined) row.kind = dto.kind;
    if (dto.title !== undefined) row.title = dto.title;
    if (dto.description !== undefined) row.description = dto.description;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;

    return this.toResponse(await this.repo.save(row));
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const row = await this.findEntity(user, id);
    row.isDeleted = true;
    row.deletedAt = new Date();
    await this.repo.save(row);
  }

  async findEntity(
    user: AuthenticatedUser,
    id: string,
  ): Promise<KsbDefinition> {
    const row = await this.repo.findOne({
      where: { id, organisationId: user.organisationId!, isDeleted: false },
    });
    if (!row) throw new NotFoundException('KSB definition not found');
    return row;
  }

  async findEntitiesForStandard(
    organisationId: string,
    standardId: string,
    ids: string[],
  ): Promise<KsbDefinition[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo
      .createQueryBuilder('ksb')
      .where('ksb.organisationId = :organisationId', { organisationId })
      .andWhere('ksb.standardId = :standardId', { standardId })
      .andWhere('ksb.isDeleted = false')
      .andWhere('ksb.id IN (:...ids)', { ids })
      .getMany();

    if (rows.length !== ids.length) {
      throw new NotFoundException(
        'One or more KSB definitions were not found for this standard',
      );
    }
    return rows;
  }

  private async requireStandard(
    organisationId: string,
    standardId: string,
  ): Promise<Standard> {
    const standard = await this.standardRepo.findOne({
      where: { id: standardId, organisationId, isDeleted: false },
    });
    if (!standard) throw new NotFoundException('Standard not found');
    return standard;
  }

  async findResponsesByIds(
    organisationId: string,
    ids: string[],
  ): Promise<KsbDefinitionResponseDto[]> {
    if (ids.length === 0) return [];
    const rows = await this.repo.find({
      where: { organisationId, id: In(ids), isDeleted: false },
    });
    return rows.map((row) => this.toResponse(row));
  }

  toResponse(entity: KsbDefinition): KsbDefinitionResponseDto {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      standardId: entity.standardId,
      code: entity.code,
      kind: entity.kind,
      title: entity.title,
      description: entity.description,
      sortOrder: entity.sortOrder,
    };
  }
}
