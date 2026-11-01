import { Goal } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import { GoalRecord } from '../AppDatabase';

export class GoalMapper {
  static toDomain(record: GoalRecord): Goal {
    return new Goal({
      id: record.id,
      title: record.title,
      whyStatement: record.whyStatement,
      categoryId: record.categoryId,
      priority: record.priority,
      status: record.status,
      targetStartDate: record.targetStartDate,
      actualStartDate: record.actualStartDate,
      deadline: record.deadline,
      actualEndDate: record.actualEndDate,
      metric: new MetricTarget({
        startValue: record.startValue,
        currentValue: record.currentValue,
        targetValue: record.targetValue,
        unit: record.unit
      }),
      isArchived: record.isArchived === 1,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }

  static toPersistence(goal: Goal): GoalRecord {
    return {
      id: goal.id,
      title: goal.title,
      whyStatement: goal.whyStatement,
      categoryId: goal.categoryId,
      priority: goal.priority,
      status: goal.status,
      targetStartDate: goal.targetStartDate,
      actualStartDate: goal.actualStartDate,
      deadline: goal.deadline,
      actualEndDate: goal.actualEndDate,
      startValue: goal.metric.startValue,
      currentValue: goal.metric.currentValue,
      targetValue: goal.metric.targetValue,
      unit: goal.metric.unit,
      isArchived: goal.isArchived ? 1 : 0,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    };
  }
}
