import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { buildPaginationMeta } from '../common/pagination/build-pagination-meta.js';
import { PaginatedResult } from '../common/pagination/paginated-result.js';

import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import { NotificationResponseDto } from './dto/notification-response.dto.js';
import { Notification } from './entities/notification.entity.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async listForUser(
    userId: string,
    query: ListNotificationsQueryDto,
    activeOrganisationId?: string | null,
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const organisationId =
      query.organisationId ?? activeOrganisationId ?? undefined;

    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.isDeleted = false');

    if (organisationId) {
      qb.andWhere('n.organisationId = :organisationId', { organisationId });
    }

    if (query.unreadOnly) {
      qb.andWhere('n.readAt IS NULL');
    }

    qb.orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage);

    const [rows, total] = await qb.getManyAndCount();

    return new PaginatedResult(
      rows.map((row) => this.toResponse(row)),
      buildPaginationMeta({ total, page, perPage }),
    );
  }

  async markRead(userId: string, id: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepo.findOne({
      where: { id, user: { id: userId }, isDeleted: false },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }

    return this.toResponse(notification);
  }

  async markAllRead(
    userId: string,
    organisationId?: string,
  ): Promise<{ updated: number }> {
    const qb = this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: () => 'NOW()' })
      .where('"userId" = :userId', { userId })
      .andWhere('"isDeleted" = false')
      .andWhere('"readAt" IS NULL');

    if (organisationId) {
      qb.andWhere('"organisationId" = :organisationId', { organisationId });
    }

    const result = await qb.execute();
    return { updated: result.affected ?? 0 };
  }

  async createForUser(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = this.notificationRepo.create({
      user: { id: dto.userId },
      organisation: dto.organisationId ? { id: dto.organisationId } : null,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      metadata: dto.metadata ?? null,
      readAt: null,
    });

    const saved = await this.notificationRepo.save(notification);
    return this.toResponse(saved);
  }

  private toResponse(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      organisationId: notification.organisationId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      readAt: notification.readAt,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
