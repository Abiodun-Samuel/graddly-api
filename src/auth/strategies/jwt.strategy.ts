import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { User } from '../../users/entities/user.entity.js';
import { UsersService } from '../../users/users.service.js';
import { IJwtPayload } from '../interfaces/jwt-payload.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>(
        'app.jwt.secret',
        'change-me-in-production',
      ),
    });
  }

  async validate(payload: IJwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    return user;
  }
}
