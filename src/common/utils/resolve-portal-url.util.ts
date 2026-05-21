import type { ConfigService } from '@nestjs/config';

import type { PortalType } from '../../organisations/portal-type.enum.js';

/**
 * Returns the frontend base URL for the given portalType.
 * Returns an empty string when portalType is undefined or the
 * portal-specific URL is not configured — callers must ensure the
 * X-Portal-Type header is present for email links to resolve correctly.
 */
export function resolvePortalFrontendUrl(
  config: ConfigService,
  portalType?: PortalType,
): string {

  if (!portalType) return '';

  const portalUrls = config.get<Record<string, string | undefined>>(
    'app.frontend.portalUrls',
    {},
  );

  return portalUrls[portalType] ?? '';
}
