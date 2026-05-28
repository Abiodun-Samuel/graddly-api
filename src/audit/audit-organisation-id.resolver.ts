import { Apprentice } from '../apprentices/entities/apprentice.entity.js';
import { Enrolment } from '../enrolments/entities/enrolment.entity.js';
import { Invitation } from '../invitations/entities/invitation.entity.js';
import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { Organisation } from '../organisations/entities/organisation.entity.js';
import { Programme } from '../programmes/entities/programme.entity.js';
import { Standard } from '../programmes/entities/standard.entity.js';

export type OrganisationScopedEntity =
  | Organisation
  | OrganisationMembership
  | Invitation
  | Programme
  | Standard
  | Apprentice
  | Enrolment
  | (Record<string, unknown> & {
      organisationId?: string;
      organisation?: { id?: string };
    });

export function resolveAuditOrganisationId(
  entity: OrganisationScopedEntity,
  entityType: string,
): string | null {
  if (entityType === 'organisations') {
    const org = entity as Organisation;
    return org.id ?? null;
  }

  if (entityType === 'invitations') {
    const invitation = entity as Invitation;
    return invitation.organisationId ?? invitation.organisation?.id ?? null;
  }

  if (entityType === 'organisation_memberships') {
    const membership = entity as OrganisationMembership & {
      organisationId?: string;
    };
    return membership.organisationId ?? membership.organisation?.id ?? null;
  }

  if (
    entityType === 'programmes' ||
    entityType === 'standards' ||
    entityType === 'apprentices' ||
    entityType === 'enrolments'
  ) {
    const scoped = entity as { organisationId?: string };
    return scoped.organisationId ?? null;
  }

  return null;
}

export function isAuditedEntity(entity: unknown): boolean {
  if (entity === null || typeof entity !== 'object') {
    return false;
  }
  const ctor = entity.constructor;
  return (
    ctor === Organisation ||
    ctor === OrganisationMembership ||
    ctor === Invitation ||
    ctor === Programme ||
    ctor === Standard ||
    ctor === Apprentice ||
    ctor === Enrolment
  );
}
