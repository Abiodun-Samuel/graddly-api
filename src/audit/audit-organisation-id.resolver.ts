import { Invitation } from '../invitations/entities/invitation.entity.js';
import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { Organisation } from '../organisations/entities/organisation.entity.js';

export type OrganisationScopedEntity =
  | Organisation
  | OrganisationMembership
  | Invitation
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
    ctor === Invitation
  );
}
