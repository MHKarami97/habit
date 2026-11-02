import { Goal, type GoalHierarchyLevel } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import type { GoalRecord } from '../AppDatabase';

export class GoalMapper {
  static toDomain(record: GoalRecord): Goal {
    let blockedByGoalIds: string[] = [];
    if (record.blockedByGoalIdsJson) {
      try {
        blockedByGoalIds = JSON.parse(record.blockedByGoalIdsJson);
      } catch {
        blockedByGoalIds = [];
      }
    }

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
        startValue: record.startValue ?? 0,
        currentValue: record.currentValue ?? 0,
        targetValue: record.targetValue ?? 10,
        unit: record.unit || 'مورد'
      }),
      isArchived: record.isArchived === 1,
      parentId: record.parentId,
      hierarchyLevel: (record.hierarchyLevel || 1) as GoalHierarchyLevel,
      timeframe: record.timeframe,
      weight: record.weight !== undefined ? record.weight : 1,
      blockedByGoalIds,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }

  static toRecord(goal: Goal): GoalRecord {
    return this.toPersistence(goal);
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
      parentId: goal.parentId,
      hierarchyLevel: goal.hierarchyLevel,
      timeframe: goal.timeframe,
      weight: goal.weight,
      blockedByGoalIdsJson: JSON.stringify(goal.blockedByGoalIds || []),
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt
    };
  }
}
