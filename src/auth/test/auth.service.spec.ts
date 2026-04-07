import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

// eslint-disable-next-line import/order
import { RedisService } from '../../redis/redis.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const { compare: mockCompare } = jest.requireMock<{
  compare: jest.Mock;
}>('bcrypt');
import { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';
import { AuthService } from '../auth.service.js';

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
};

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

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
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
});
