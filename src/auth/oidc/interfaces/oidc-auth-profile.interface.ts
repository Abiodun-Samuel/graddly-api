/** Passport `validate()` output for OIDC (no local User link until OIDC-003). */
export interface IOidcAuthProfile {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  idToken?: string;
  accessToken?: string;
}
