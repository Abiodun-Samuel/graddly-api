import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';

import { OrganisationMembership } from './entities/organisation-membership.entity.js';
import { Organisation } from './entities/organisation.entity.js';
import { OrganisationsController } from './organisations.controller.js';
import { OrganisationsService } from './organisations.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organisation, OrganisationMembership]),
    AuthModule,
  ],
  controllers: [OrganisationsController],
  providers: [OrganisationsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
