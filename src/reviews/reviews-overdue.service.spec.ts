import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Review } from './entities/review.entity.js';
import { ReviewsOverdueService } from './reviews-overdue.service.js';

describe('ReviewsOverdueService', () => {
  const qb = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };
  const reviewRepo = { createQueryBuilder: jest.fn(() => qb) };

  let service: ReviewsOverdueService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewsOverdueService,
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
      ],
    }).compile();

    service = moduleRef.get(ReviewsOverdueService);
    jest.clearAllMocks();
  });

  it('flags overdue reviews via bulk update', async () => {
    qb.execute.mockResolvedValue({ affected: 3 });
    const count = await service.flagOverdueReviews();
    expect(count).toBe(3);
    expect(qb.update).toHaveBeenCalled();
  });
});
