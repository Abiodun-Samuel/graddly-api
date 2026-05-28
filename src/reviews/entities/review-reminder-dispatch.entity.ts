import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ReviewReminderKind } from '../enums/review-reminder-kind.enum.js';

import { Review } from './review.entity.js';

@Entity('review_reminder_dispatches')
export class ReviewReminderDispatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'uuid' })
  reviewId!: string;

  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewId' })
  review!: Review;

  @Column({
    type: 'enum',
    enum: ReviewReminderKind,
    enumName: 'review_reminder_kind',
  })
  reminderKind!: ReviewReminderKind;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  sentAt!: Date;
}
