import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EmailDispatchService } from '../email/email-dispatch.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { User } from '../users/entities/user.entity.js';

import { ReviewReminderDispatch } from './entities/review-reminder-dispatch.entity.js';
import { Review } from './entities/review.entity.js';
import { ReviewStatus } from './enums/review-status.enum.js';
import { ReviewsReminderService } from './reviews-reminder.service.js';

describe('ReviewsReminderService', () => {
  const reviewRepo = { find: jest.fn() };
  const dispatchRepo = {
    findOne: jest.fn(),
    create: jest.fn((v: unknown) => v),
    save: jest.fn(),
  };
  const userRepo = { find: jest.fn() };
  const notificationsService = { createForUser: jest.fn() };
  const emailDispatchService = { enqueue: jest.fn() };
  let service: ReviewsReminderService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewsReminderService,
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        {
          provide: getRepositoryToken(ReviewReminderDispatch),
          useValue: dispatchRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailDispatchService, useValue: emailDispatchService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('Graddly') },
        },
      ],
    }).compile();

    service = moduleRef.get(ReviewsReminderService);
    jest.clearAllMocks();
  });

  it('skips reviews that already have a dispatch row', async () => {
    const scheduledAt = new Date();
    scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 7);
    reviewRepo.find.mockResolvedValue([
      {
        id: 'r-1',
        status: ReviewStatus.SCHEDULED,
        scheduledAt,
        organisationId: 'org-1',
        title: 'Progress review',
        tutorUserId: 'u-1',
        apprenticeUserId: 'u-2',
        employerManagerUserId: 'u-3',
      },
    ]);
    dispatchRepo.findOne.mockResolvedValue({ id: 'd-1' });

    const sent = await service.sendDueReminders();
    expect(sent).toBe(0);
    expect(notificationsService.createForUser).not.toHaveBeenCalled();
  });
});
