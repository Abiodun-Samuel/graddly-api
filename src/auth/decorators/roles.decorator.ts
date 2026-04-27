import { SetMetadata } from '@nestjs/common';

import { OrganisationRole } from '../../organisations/organisation-role.enum.js';

/** Metadata key for {@link Roles}. */
export const ROLES_KEY = 'organisationRoles';

/**
 * Restricts a route to users whose active-org role is one of the given roles
 * (OR semantics: any match allows access).
 */
export const Roles = (...roles: OrganisationRole[]) =>
  SetMetadata(ROLES_KEY, roles);
