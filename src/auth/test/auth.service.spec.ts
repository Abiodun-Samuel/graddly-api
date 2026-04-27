import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { OrganisationMembership } from '../../organisations/entities/organisation-membership.entity.js';
import { OrganisationRole } from '../../organisations/organisation-role.enum.js';
import { RedisService } from '../../redis/redis.service.js';
import { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';
import { AuthService } from '../auth.service.js';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const { compare: mockCompare } = jest.requireMock<{
  compare: jest.Mock;
}>('bcrypt');

const mockUser: User = {
  id: 'user-uuid-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: '$2b$12$hashedpassword',
  isEmailVerified: false,
  isActive: true,
  avatarUrl: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  isDeleted: false,
  deletedAt: null,
} as never;

const mockUsersService = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-jwt-token'),
};

const mockConfigService = {
  get: jest.fn((key: string, fallback?: string) => {
    const values: Record<string, string> = {
      ['app.jwt.accessExpiresIn']: '15m',
      ['app.jwt.refreshExpiresIn']: '7d',
    };
    return values[key] ?? fallback;
  }),
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockMembershipRepo = {
  find: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    mockMembershipRepo.find.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: getRepositoryToken(OrganisationMembership),
          useValue: mockMembershipRepo,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockMembershipRepo.find.mockResolvedValue([]);
  });

  describe('signup', () => {
    const dto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'P@ssw0rd!',
    };

    it('should create a user and return tokens', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await authService.signup(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh:'),
        mockUser.id,
        expect.any(Number),
      );
    });
  });

  describe('login', () => {
    const dto = { email: 'john@example.com', password: 'P@ssw0rd!' };

    it('should return tokens for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockCompare.mockResolvedValue(true);

      const result = await authService.login(dto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if account is deactivated', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(authService.login(dto)).rejects.toThrow(
        new UnauthorizedException('Account is deactivated'),
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockCompare.mockResolvedValue(false);

      await expect(authService.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('refresh', () => {
    const refreshToken = 'valid-refresh-uuid';

    it('should return new tokens for a valid refresh token', async () => {
      mockRedisService.get.mockResolvedValue(mockUser.id);
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await authService.refresh(refreshToken);

      expect(mockRedisService.get).toHaveBeenCalledWith(
        `refresh:${refreshToken}`,
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        `refresh:${refreshToken}`,
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });
  });

  describe('logout', () => {
    it('should delete the refresh token from Redis', async () => {
      const refreshToken = 'token-to-invalidate';

      await authService.logout(refreshToken);

      expect(mockRedisService.del).toHaveBeenCalledWith(
        `refresh:${refreshToken}`,
      );
    });
  });

  describe('JWT payload (org claims)', () => {
    const dto = { email: 'john@example.com', password: 'P@ssw0rd!' };

    it('signs access token without orgId when user has no memberships', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockCompare.mockResolvedValue(true);
      mockMembershipRepo.find.mockResolvedValue([]);

      await authService.login(dto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
        },
        expect.any(Object),
      );
    });

    it('includes orgId and roles when active membership exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockCompare.mockResolvedValue(true);
      mockMembershipRepo.find.mockResolvedValue([
        {
          role: OrganisationRole.MEMBER,
          createdAt: new Date('2026-02-01'),
          organisation: { id: 'org-later' },
        },
        {
          role: OrganisationRole.OWNER,
          createdAt: new Date('2026-01-01'),
          organisation: { id: 'org-earlier' },
        },
      ]);

      await authService.login(dto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          orgId: 'org-earlier',
          roles: [OrganisationRole.OWNER],
        },
        expect.any(Object),
      );
    });
  });
});
