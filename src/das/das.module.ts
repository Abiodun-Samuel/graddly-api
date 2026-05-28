import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { Enrolment } from '../enrolments/entities/enrolment.entity.js';
import { Organisation } from '../organisations/entities/organisation.entity.js';
import { Standard } from '../programmes/entities/standard.entity.js';

import { DasHttpClient } from './das-http.client.js';
import { DasLevyForecastService } from './das-levy-forecast.service.js';
import { DasLevySyncService } from './das-levy-sync.service.js';
import { DasOAuthService } from './das-oauth.service.js';
import { DasSyncDispatchService } from './das-sync-dispatch.service.js';
import { DasController } from './das.controller.js';
import { DasLevyBalance } from './entities/das-levy-balance.entity.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      DasLevyBalance,
      Organisation,
      Enrolment,
      Standard,
    ]),
  ],
  controllers: [DasController],
  providers: [
    DasOAuthService,
    DasHttpClient,
    DasLevyForecastService,
    DasLevySyncService,
    DasSyncDispatchService,
  ],
  exports: [
    TypeOrmModule,
    DasOAuthService,
    DasHttpClient,
    DasLevyForecastService,
    DasLevySyncService,
    DasSyncDispatchService,
  ],
})
export class DasModule {}
