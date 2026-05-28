import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';

import { WithdrawalCompletionPush } from './entities/withdrawal-completion-push.entity.js';
import { WithdrawalPushDispatchService } from './withdrawal-push-dispatch.service.js';
import { WithdrawalPushController } from './withdrawal-push.controller.js';
import { WithdrawalPushService } from './withdrawal-push.service.js';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([WithdrawalCompletionPush])],
  controllers: [WithdrawalPushController],
  providers: [WithdrawalPushDispatchService, WithdrawalPushService],
  exports: [
    WithdrawalPushDispatchService,
    WithdrawalPushService,
    TypeOrmModule,
  ],
})
export class WithdrawalPushModule {}
