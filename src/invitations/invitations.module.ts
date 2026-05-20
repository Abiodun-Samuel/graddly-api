import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Invitation } from './entities/invitation.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Invitation])],
  exports: [TypeOrmModule],
})
export class InvitationsModule {}
