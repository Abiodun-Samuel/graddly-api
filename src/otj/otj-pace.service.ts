import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Enrolment } from '../enrolments/entities/enrolment.entity.js';
import { EnrolmentStatus } from '../enrolments/enums/enrolment-status.enum.js';

import { OtjLogEntry } from './entities/otj-log-entry.entity.js';
import { OtjLogStatus } from './enums/otj-log-status.enum.js';

@Injectable()
export class OtjPaceService {
  constructor(
    @InjectRepository(OtjLogEntry)
    private readonly otjRepo: Repository<OtjLogEntry>,
    @InjectRepository(Enrolment)
    private readonly enrolmentRepo: Repository<Enrolment>,
  ) {}

  async flagPaceForAllActiveEnrolments(): Promise<number> {
    const activeEnrolments = await this.enrolmentRepo.find({
      where: { status: EnrolmentStatus.ACTIVE, isDeleted: false },
      select: ['id', 'organisationId'],
    });
    let updated = 0;
    for (const enrolment of activeEnrolments) {
      const entries = await this.otjRepo.find({
        where: {
          enrolmentId: enrolment.id,
          organisationId: enrolment.organisationId,
          isDeleted: false,
          status: OtjLogStatus.APPROVED,
        },
        order: { loggedDate: 'DESC' },
      });
      const last30 = entries.filter((entry) => {
        const date = new Date(entry.loggedDate);
        return date.getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
      });
      const minutes = last30.reduce((sum, item) => sum + item.minutes, 0);
      const paceFlag =
        minutes >= 600 ? 'on_track' : minutes >= 300 ? 'at_risk' : 'off_track';
      for (const entry of entries) {
        if (entry.paceFlag !== paceFlag) {
          entry.paceFlag = paceFlag;
          await this.otjRepo.save(entry);
          updated += 1;
        }
      }
    }
    return updated;
  }
}
