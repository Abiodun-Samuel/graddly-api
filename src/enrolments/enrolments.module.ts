import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Apprentice } from '../apprentices/entities/apprentice.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { Standard } from '../programmes/entities/standard.entity.js';
import { WithdrawalPushModule } from '../withdrawal-push/withdrawal-push.module.js';

import { EnrolmentsController } from './enrolments.controller.js';
import { EnrolmentsService } from './enrolments.service.js';
import { Enrolment } from './entities/enrolment.entity.js';

@Module({
  imports: [
    AuthModule,
    WithdrawalPushModule,
    TypeOrmModule.forFeature([Enrolment, Apprentice, Standard]),
  ],
  controllers: [EnrolmentsController],
  providers: [EnrolmentsService],
  exports: [TypeOrmModule, EnrolmentsService],
})
export class EnrolmentsModule {}
