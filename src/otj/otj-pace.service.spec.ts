import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Enrolment } from '../enrolments/entities/enrolment.entity.js';

import { OtjLogEntry } from './entities/otj-log-entry.entity.js';
import { OtjLogStatus } from './enums/otj-log-status.enum.js';
import { OtjPaceService } from './otj-pace.service.js';

describe('OtjPaceService', () => {
  const otjRepo = {
    find: jest.fn(),
    save: jest.fn(),
  };
  const enrolmentRepo = {
    find: jest.fn(),
  };

  let service: OtjPaceService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OtjPaceService,
        { provide: getRepositoryToken(OtjLogEntry), useValue: otjRepo },
        { provide: getRepositoryToken(Enrolment), useValue: enrolmentRepo },
      ],
    }).compile();
    service = moduleRef.get(OtjPaceService);
    jest.clearAllMocks();
  });

  it('updates pace flags for active enrolments', async () => {
    enrolmentRepo.find.mockResolvedValue([{ id: 'e1', organisationId: 'o1' }]);
    otjRepo.find.mockResolvedValue([
      {
        id: 'log1',
        loggedDate: new Date().toISOString().slice(0, 10),
        minutes: 700,
        paceFlag: null,
        status: OtjLogStatus.APPROVED,
      },
    ]);
    otjRepo.save.mockResolvedValue(undefined);

    const updated = await service.flagPaceForAllActiveEnrolments();
    expect(updated).toBe(1);
  });
});
