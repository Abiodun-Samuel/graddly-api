import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Enrolment } from '../enrolments/entities/enrolment.entity.js';
import { EnrolmentStatus } from '../enrolments/enums/enrolment-status.enum.js';
import { Standard } from '../programmes/entities/standard.entity.js';

import { DasLevyForecastService } from './das-levy-forecast.service.js';
import { DasLevyBalance } from './entities/das-levy-balance.entity.js';

describe('DasLevyForecastService', () => {
  const enrolmentRepo = { find: jest.fn() };
  const standardRepo = { findBy: jest.fn() };
  const levyRepo = { findOne: jest.fn() };

  let service: DasLevyForecastService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DasLevyForecastService,
        { provide: getRepositoryToken(Enrolment), useValue: enrolmentRepo },
        { provide: getRepositoryToken(Standard), useValue: standardRepo },
        { provide: getRepositoryToken(DasLevyBalance), useValue: levyRepo },
      ],
    }).compile();
    service = moduleRef.get(DasLevyForecastService);
    jest.clearAllMocks();
  });

  it('computes forecast summary from active enrolments and levy balance', async () => {
    enrolmentRepo.find.mockResolvedValue([
      {
        standardId: 'std-1',
        agreedPrice: '12000',
        plannedDurationMonths: 12,
        completionPaymentPercent: '20',
        status: EnrolmentStatus.ACTIVE,
      },
    ]);
    standardRepo.findBy.mockResolvedValue([
      { id: 'std-1', fundingBandMax: '14000' },
    ]);
    levyRepo.findOne.mockResolvedValue({ balance: '6000' });

    const result = await service.forecastForOrganisation('org-1', 12);

    expect(result.organisationId).toBe('org-1');
    expect(result.activeEnrolmentCount).toBe(1);
    expect(result.projectedMonthlySpend).toBeCloseTo(800, 2);
    expect(result.estimatedRunwayMonths).toBeCloseTo(7.5, 2);
  });
});
