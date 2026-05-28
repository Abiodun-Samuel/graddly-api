import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Enrolment } from '../enrolments/entities/enrolment.entity.js';
import { EnrolmentStatus } from '../enrolments/enums/enrolment-status.enum.js';
import { Standard } from '../programmes/entities/standard.entity.js';

import { DasLevyForecastResponseDto } from './dto/das-levy-forecast-response.dto.js';
import { DasLevyBalance } from './entities/das-levy-balance.entity.js';

@Injectable()
export class DasLevyForecastService {
  constructor(
    @InjectRepository(Enrolment)
    private readonly enrolmentRepo: Repository<Enrolment>,
    @InjectRepository(Standard)
    private readonly standardRepo: Repository<Standard>,
    @InjectRepository(DasLevyBalance)
    private readonly levyRepo: Repository<DasLevyBalance>,
  ) {}

  async forecastForOrganisation(
    organisationId: string,
    horizonMonths = 12,
  ): Promise<DasLevyForecastResponseDto> {
    const activeEnrolments = await this.enrolmentRepo.find({
      where: {
        organisationId,
        status: EnrolmentStatus.ACTIVE,
        isDeleted: false,
      },
    });
    const standardIds = [...new Set(activeEnrolments.map((e) => e.standardId))];
    const standards = standardIds.length
      ? await this.standardRepo.findBy({
          id: In(standardIds),
          isDeleted: false,
        })
      : [];
    const standardMap = new Map(standards.map((s) => [s.id, s]));

    let monthly = 0;
    let completion = 0;
    for (const enrolment of activeEnrolments) {
      const standard = standardMap.get(enrolment.standardId);
      const fundingBand = Number(standard?.fundingBandMax ?? 0);
      const agreedPrice = Number(enrolment.agreedPrice ?? fundingBand);
      const total = Math.min(
        agreedPrice || fundingBand,
        fundingBand || agreedPrice,
      );
      const completionPct =
        Number(enrolment.completionPaymentPercent ?? 20) / 100;
      const duration =
        enrolment.plannedDurationMonths ??
        standard?.defaultDurationMonths ??
        horizonMonths;
      const onProgramme = total * (1 - completionPct);
      monthly += onProgramme / Math.max(duration, 1);
      completion += total * completionPct;
    }

    const levy = await this.levyRepo.findOne({
      where: { organisationId, isDeleted: false },
      order: { updatedAt: 'DESC' },
    });
    const balance = levy ? Number(levy.balance) : null;
    const runway =
      balance !== null && monthly > 0
        ? Number((balance / monthly).toFixed(2))
        : null;

    return {
      organisationId,
      horizonMonths,
      activeEnrolmentCount: activeEnrolments.length,
      projectedMonthlySpend: Number(monthly.toFixed(2)),
      projectedCompletionLiability: Number(completion.toFixed(2)),
      latestLevyBalance: balance,
      estimatedRunwayMonths: runway,
    };
  }
}
