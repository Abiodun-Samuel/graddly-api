import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOidcIdentity } from './entities/user-oidc-identity.entity.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserOidcIdentity])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
