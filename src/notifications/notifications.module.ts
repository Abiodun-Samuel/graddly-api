import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DigestDispatchService } from './digest-dispatch.service.js';
import { NotificationPreference } from './entities/notification-preference.entity.js';
import { Notification } from './entities/notification.entity.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationPreference])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationPreferencesService,
    DigestDispatchService,
  ],
  exports: [
    NotificationsService,
    NotificationPreferencesService,
    DigestDispatchService,
  ],
})
export class NotificationsModule {}
