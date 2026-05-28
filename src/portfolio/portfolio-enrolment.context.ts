import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Enrolment } from '../enrolments/entities/enrolment.entity.js';

@Injectable()
export class PortfolioEnrolmentContext {
  constructor(
    @InjectRepository(Enrolment)
    private readonly enrolmentRepo: Repository<Enrolment>,
  ) {}

  async requireEnrolment(
    organisationId: string,
    enrolmentId: string,
    apprenticeId?: string,
  ): Promise<Enrolment> {
    const enrolment = await this.enrolmentRepo.findOne({
      where: { id: enrolmentId, organisationId, isDeleted: false },
    });
    if (!enrolment) {
      throw new NotFoundException('Enrolment not found');
    }
    if (apprenticeId !== undefined && enrolment.apprenticeId !== apprenticeId) {
      throw new BadRequestException(
        'Apprentice does not match the specified enrolment',
      );
    }
    return enrolment;
  }
}
