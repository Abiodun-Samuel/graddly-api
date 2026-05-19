export const OIDC_PROVISIONING_MODES = [
  'auto_create',
  'link_existing',
] as const;

export type OidcProvisioningMode = (typeof OIDC_PROVISIONING_MODES)[number];

export function isOidcProvisioningMode(
  value: string,
): value is OidcProvisioningMode {
  return (OIDC_PROVISIONING_MODES as readonly string[]).includes(value);
}
