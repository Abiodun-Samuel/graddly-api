export interface IOidcE2eClaims {
  sub: string;
  email?: string;
  emailVerified?: boolean;
}

const defaultClaims: IOidcE2eClaims = {
  sub: 'e2e-one-login-sub',
  email: 'oidc-e2e@example.com',
  emailVerified: true,
};

let claims: IOidcE2eClaims = { ...defaultClaims };
let authFail = false;

export function setOidcE2eClaims(partial: Partial<IOidcE2eClaims>): void {
  claims = { ...defaultClaims, ...partial };
}

export function setOidcE2eAuthFail(fail: boolean): void {
  authFail = fail;
}

export function shouldOidcE2eAuthFail(): boolean {
  return authFail;
}

export function resetOidcE2eClaims(): void {
  claims = { ...defaultClaims };
  authFail = false;
}

export function getOidcE2eClaims(): IOidcE2eClaims {
  return { ...claims };
}

/** Maps test claims to openid-client JWT claim names (snake_case). */
export function getOidcE2eClaimsForTokenEndpoint(): {
  sub: string;
  email?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  email_verified?: boolean;
} {
  const current = getOidcE2eClaims();
  return {
    sub: current.sub,
    email: current.email,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    email_verified: current.emailVerified,
  };
}
