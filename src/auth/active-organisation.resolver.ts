import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { validate as validateUuid } from 'uuid';

import { ORGANISATION_ID_HEADER } from '../common/constants/organisation-headers.js';
import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';

import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';

/**
 * Applies optional `X-Organisation-Id` override on top of JWT-derived `req.user`.
 * When the header is absent or blank, leaves `organisationId` / `roles` unchanged.
 */
@Injectable()
export class ActiveOrganisationResolver {
  constructor(
    @InjectRepository(OrganisationMembership)
    private readonly membershipRepo: Repository<OrganisationMembership>,
  ) {}

  async applyHeaderOverride(request: Request): Promise<void> {
    const user = request.user as AuthenticatedUser | undefined;
    if (!user?.id) {
      return;
    }

    const raw = request.headers[ORGANISATION_ID_HEADER];
    const headerVal =
      typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;

    if (!headerVal?.trim()) {
      return;
    }

    const orgId = headerVal.trim();
    if (!validateUuid(orgId)) {
      throw new BadRequestException('Invalid X-Organisation-Id header');
    }

    const membership = await this.membershipRepo.findOne({
      where: {
        user: { id: user.id },
        organisation: { id: orgId },
      },
      relations: ['organisation'],
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organisation');
    }

    user.organisationId = membership.organisation.id;
    user.roles = [membership.role];
  }
}
