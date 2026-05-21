import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { PORTAL_TYPE_HEADER } from '../common/constants/organisation-headers.js';
import {
  ApiAuthResponseDto,
  ApiMeResponseDto,
} from '../common/dto/api-response.dto.js';
import {
  ErrorResponseDto,
  TooManyRequestsResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/error-response.dto.js';
import { ResponseMessage } from '../common/interceptors/response-message.decorator.js';
import { PortalType } from '../organisations/portal-type.enum.js';
import { UpdateProfileDto } from '../users/dto/update-profile.dto.js';
import { UsersService } from '../users/users.service.js';

import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { ActiveOrganisationMeDto } from './dto/active-organisation-context.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';

/** Safely coerce the raw header value to a known PortalType, or undefined. */
function parsePortalType(raw: string | undefined): PortalType | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  return (Object.values(PortalType) as string[]).includes(lower)
    ? (lower as PortalType)
    : undefined;
}

type MeResult = Omit<
  AuthenticatedUser,
  'organisationId' | 'roles' | 'memberships' | 'password'
> & { activeOrganisation: ActiveOrganisationMeDto | null };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('signup')
  @Throttle({ default: { limit: 0 }, auth: { ttl: 60_000, limit: 5 } })
  @ResponseMessage('Account created successfully')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with the provided details. Returns a short-lived access token and a long-lived refresh token. The email must be unique across the system. Rate limited to 5 requests per minute.',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: ApiAuthResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email already in use',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests',
    type: TooManyRequestsResponseDto as never,
  })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 0 }, auth: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Logged in successfully')
  @ApiOperation({
    summary: 'Log in with email and password',
    description:
      'Authenticates a user with their email and password. Returns a new token pair. Fails if the credentials are invalid or the account is deactivated. Rate limited to 5 requests per minute.',
  })
  @ApiOkResponse({ description: 'Login successful', type: ApiAuthResponseDto })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account deactivated',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests',
    type: TooManyRequestsResponseDto as never,
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Token refreshed successfully')
  @ApiOperation({
    summary: 'Refresh an access token',
    description:
      'Exchanges a valid refresh token for a new access/refresh token pair. The old refresh token is invalidated (rotation). Fails if the refresh token is expired or already used.',
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: ApiAuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log out (invalidate refresh token)',
    description:
      'Invalidates the provided refresh token so it can no longer be used to obtain new access tokens. Requires a valid access token in the Authorization header.',
  })
  @ApiNoContentResponse({ description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  logout(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('User profile retrieved')
  @ApiHeader({
    name: 'X-Portal-Type',
    description:
      "Required for a non-null activeOrganisation. Must be a valid portal type (employer | apprentice | flow | provider) whose value matches the user's membership. Missing or unrecognised values yield activeOrganisation: null.",
    required: false,
    schema: { type: 'string', enum: Object.values(PortalType) },
  })
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      "Returns the authenticated user's profile. activeOrganisation is populated only when X-Portal-Type is a valid enum value and the user holds an active membership in an organisation of that portal type.",
  })
  @ApiOkResponse({
    description: 'User profile with active organisation',
    type: ApiMeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  async me(
    @CurrentUser() user: AuthenticatedUser,
    @Headers(PORTAL_TYPE_HEADER) rawPortalType?: string,
  ): Promise<MeResult> {
    const portalType = parsePortalType(rawPortalType);

    let activeOrganisation: ActiveOrganisationMeDto | null = null;
    if (portalType) {
      try {
        activeOrganisation =
          await this.authService.resolveActiveOrganisationForUser(
            user.id,
            portalType,
          );
      } catch (err) {
        this.logger.error('Failed to resolve active organisation for /me', err);
      }
    }

    const {
      organisationId: _organisationId,
      roles: _roles,
      memberships: _memberships,
      password: _password,
      ...publicUser
    } = user;
    return { ...publicUser, activeOrganisation };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Profile updated successfully')
  @ApiHeader({
    name: 'X-Portal-Type',
    description:
      "Required for a non-null activeOrganisation. Must be a valid portal type matching the user's membership. Missing or unrecognised values yield activeOrganisation: null.",
    required: false,
    schema: { type: 'string', enum: Object.values(PortalType) },
  })
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      "Partially updates the authenticated user's profile. Email and password changes require their own dedicated flows. Returns the full updated profile with activeOrganisation when X-Portal-Type is provided.",
  })
  @ApiOkResponse({
    description: 'Updated user profile',
    type: ApiMeResponseDto,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
    @Headers(PORTAL_TYPE_HEADER) rawPortalType?: string,
  ): Promise<MeResult> {
    const portalType = parsePortalType(rawPortalType);

    const [updatedUser, activeOrganisation] = await Promise.all([
      this.usersService.updateProfile(user.id, dto),
      portalType
        ? this.authService
            .resolveActiveOrganisationForUser(user.id, portalType)
            .catch((err) => {
              this.logger.error(
                'Failed to resolve active organisation after profile update',
                err,
              );
              return null;
            })
        : Promise.resolve(null),
    ]);

    const {
      password: _password,
      memberships: _memberships,
      ...publicUser
    } = updatedUser;
    return { ...publicUser, activeOrganisation };
  }
}
