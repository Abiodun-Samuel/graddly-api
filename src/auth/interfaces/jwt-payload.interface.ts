/**
 * Signed access-token claims. `orgId` / `roles` are omitted when the user has no active membership.
 */
export interface IJwtPayload {
  sub: string;
  email: string;
  /** Active organisation id (tenant context). */
  orgId?: string;
  /** Roles in the active organisation (typically one entry today). */
  roles?: string[];
}
