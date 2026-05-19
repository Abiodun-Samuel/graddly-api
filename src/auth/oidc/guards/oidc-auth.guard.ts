import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** For OIDC callback routes (wired in OIDC-002). */
@Injectable()
export class OidcAuthGuard extends AuthGuard('oidc') {}
