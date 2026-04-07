import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidV4 } from 'uuid';

import { RedisService } from '../redis/redis.service.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';

import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { IJwtPayload } from './interfaces/jwt-payload.interface.js';

const REFRESH_PREFIX = 'refresh:';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create(dto);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const userId = await this.redis.get(`${REFRESH_PREFIX}${refreshToken}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.redis.del(`${REFRESH_PREFIX}${refreshToken}`);

    const user = await this.usersService.findById(userId);
    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.redis.del(`${REFRESH_PREFIX}${refreshToken}`);
  }

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const jwtPayload: IJwtPayload = { sub: user.id, email: user.email };

    const accessTtl = this.parseToSeconds(
      this.config.get<string>('app.jwt.accessExpiresIn', '15m'),
    );
    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: accessTtl,
    });

    const refreshToken = uuidV4();
    const refreshTtl = this.parseToSeconds(
      this.config.get<string>('app.jwt.refreshExpiresIn', '7d'),
    );
    await this.redis.set(
      `${REFRESH_PREFIX}${refreshToken}`,
      user.id,
      refreshTtl,
    );

    return { accessToken, refreshToken };
  }

  private parseToSeconds(duration: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match) return 604800; // default 7 days
    return parseInt(match[1], 10) * (units[match[2]] ?? 1);
  }
}
