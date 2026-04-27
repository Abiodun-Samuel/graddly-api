import { User } from '../../users/entities/user.entity.js';

/**
 * `req.user` after JwtStrategy: optional active-org context mirrored from JWT (`orgId` → `organisationId`).
 */
export type AuthenticatedUser = User & {
  organisationId?: string;
  roles?: string[];
};
