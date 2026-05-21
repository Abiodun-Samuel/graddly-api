/** Passport `validate()` output for OIDC. */
export interface IOidcAuthProfile {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  givenName?: string;
  familyName?: string;
  idToken?: string;
  accessToken?: string;
}
