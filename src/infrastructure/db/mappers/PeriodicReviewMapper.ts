import { PeriodicReview } from '@/domain/entities/PeriodicReview';
import type { PeriodicReviewRecord } from '../AppDatabase';

export class PeriodicReviewMapper {
  static toDomain(record: PeriodicReviewRecord): PeriodicReview {
    return new PeriodicReview({
      id: record.id,
      type: record.type,
      periodKey: record.periodKey,
      solarYear: record.solarYear,
      solarPeriod: record.solarPeriod,
      periodLabel: record.periodLabel,
      startDateIso: record.startDateIso,
      endDateIso: record.endDateIso,
      whatWorked: record.whatWorked,
      whatDidntWork: record.whatDidntWork,
      primaryObstacle: record.primaryObstacle,
      actionPlan: record.actionPlan,
      adherenceRate: record.adherenceRate,
      completedHabitsCount: record.completedHabitsCount,
      totalExpectedHabits: record.totalExpectedHabits,
      activeGoalsCount: record.activeGoalsCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }

  static toRecord(domain: PeriodicReview): PeriodicReviewRecord {
    return {
      id: domain.id,
      type: domain.type,
      periodKey: domain.periodKey,
      solarYear: domain.solarYear,
      solarPeriod: domain.solarPeriod,
      periodLabel: domain.periodLabel,
      startDateIso: domain.startDateIso,
      endDateIso: domain.endDateIso,
      whatWorked: domain.whatWorked,
      whatDidntWork: domain.whatDidntWork,
      primaryObstacle: domain.primaryObstacle,
      actionPlan: domain.actionPlan,
      adherenceRate: domain.adherenceRate,
      completedHabitsCount: domain.completedHabitsCount,
      totalExpectedHabits: domain.totalExpectedHabits,
      activeGoalsCount: domain.activeGoalsCount,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    };
  }
}
