import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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

import {
  ApiAuthResponseDto,
  ApiUserResponseDto,
} from '../common/dto/api-response.dto.js';
import {
  ErrorResponseDto,
  TooManyRequestsResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/error-response.dto.js';
import { ResponseMessage } from '../common/interceptors/response-message.decorator.js';

import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import {
  ApiActiveOrganisationResponseDto,
  ActiveOrganisationContextDto,
} from './dto/active-organisation-context.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { ActiveOrganisationGuard } from './guards/active-organisation.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @ApiOkResponse({
    description: 'Login successful',
    type: ApiAuthResponseDto,
  })
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
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the profile of the currently authenticated user. The user is resolved from the JWT access token.',
  })
  @ApiOkResponse({
    description: 'Current user profile',
    type: ApiUserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Get('active-organisation')
  @UseGuards(JwtAuthGuard, ActiveOrganisationGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'X-Organisation-Id',
    description:
      'Optional. Overrides the JWT default active organisation when you are a member.',
    required: false,
    schema: { format: 'uuid', type: 'string' },
  })
  @ResponseMessage('Active organisation resolved')
  @ApiOperation({
    summary: 'Get resolved active organisation context',
    description:
      'Requires a bearer access token that includes organisation context (`orgId` in JWT) unless you supply `X-Organisation-Id` for a membership you belong to.',
  })
  @ApiOkResponse({
    description: 'Current resolved organisation id and roles',
    type: ApiActiveOrganisationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid X-Organisation-Id header',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'No organisation context, not a member of requested org, or invalid membership',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  activeOrganisation(
    @CurrentUser() user: AuthenticatedUser,
  ): ActiveOrganisationContextDto {
    return {
      organisationId: user.organisationId!,
      roles: user.roles ?? [],
    };
  }
}
