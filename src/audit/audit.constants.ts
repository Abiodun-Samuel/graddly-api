import { Invitation } from '../invitations/entities/invitation.entity.js';
import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { Organisation } from '../organisations/entities/organisation.entity.js';

export const AUDITED_ENTITIES = new Set([
  Organisation,
  OrganisationMembership,
  Invitation,
]);

export const AUDIT_EXCLUDED_FIELDS = new Set([
  'password',
  'passwordHash',
  'updatedAt',
  'createdAt',
  'deletedAt',
  'isDeleted',
  'id',
]);

export const AUDIT_RELATION_FIELDS = new Set([
  'user',
  'organisation',
  'invitedBy',
  'memberships',
]);
