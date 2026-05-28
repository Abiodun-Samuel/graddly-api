import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { Organisation } from '../organisations/entities/organisation.entity.js';

import { DasHttpClient } from './das-http.client.js';
import { DasLevySyncService } from './das-levy-sync.service.js';
import { DasOAuthService } from './das-oauth.service.js';
import { DasSyncDispatchService } from './das-sync-dispatch.service.js';
import { DasController } from './das.controller.js';
import { DasLevyBalance } from './entities/das-levy-balance.entity.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([DasLevyBalance, Organisation]),
  ],
  controllers: [DasController],
  providers: [
    DasOAuthService,
    DasHttpClient,
    DasLevySyncService,
    DasSyncDispatchService,
  ],
  exports: [
    TypeOrmModule,
    DasOAuthService,
    DasHttpClient,
    DasLevySyncService,
    DasSyncDispatchService,
  ],
})
export class DasModule {}
