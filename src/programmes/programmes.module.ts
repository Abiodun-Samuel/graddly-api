import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';

import { Programme } from './entities/programme.entity.js';
import { Standard } from './entities/standard.entity.js';
import { ProgrammesController } from './programmes.controller.js';
import { ProgrammesService } from './programmes.service.js';
import { StandardsController } from './standards.controller.js';
import { StandardsService } from './standards.service.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Programme, Standard])],
  controllers: [ProgrammesController, StandardsController],
  providers: [ProgrammesService, StandardsService],
  exports: [TypeOrmModule, ProgrammesService, StandardsService],
})
export class ProgrammesModule {}
