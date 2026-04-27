import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { UsersModule } from '../users/users.module.js';

import { ActiveOrganisationResolver } from './active-organisation.resolver.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ActiveOrganisationGuard } from './guards/active-organisation.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([OrganisationMembership]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwt.secret'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ActiveOrganisationResolver,
    ActiveOrganisationGuard,
  ],
  exports: [
    PassportModule,
    JwtModule,
    JwtStrategy,
    ActiveOrganisationGuard,
    ActiveOrganisationResolver,
  ],
})
export class AuthModule {}
