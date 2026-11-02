import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { Goal, type GoalHierarchyLevel } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import { GoalPriority } from '@/domain/value-objects/GoalPriority';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { GoalHierarchyService } from '@/domain/services/GoalHierarchyService';
import { GoalDependencyService } from '@/domain/services/GoalDependencyService';

export interface UpdateGoalInput {
  readonly id: string;
  readonly title: string;
  readonly whyStatement: string;
  readonly categoryId?: string;
  readonly priority: GoalPriority;
  readonly status?: GoalStatus;
  readonly targetStartDate: string;
  readonly deadline: string;
  readonly startValue: number;
  readonly targetValue: number;
  readonly unit: string;
  readonly parentId?: string;
  readonly weight?: number;
  readonly blockedByGoalIds?: readonly string[];
}

export class UpdateGoalUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: UpdateGoalInput): Promise<Goal> {
    const existing = await this.goalRepo.findById(input.id);
    if (!existing) {
      throw new Error(`هدف با شناسه ${input.id} یافت نشد.`);
    }

    const allGoals = await this.goalRepo.findAll();
    const nowIso = new Date().toISOString();

    // اعتبارسنجی سلسله‌مراتب و عمق حداکثر ۳ سطح در صورت انتساب والد جدید
    let hierarchyLevel: GoalHierarchyLevel = 1;
    if (input.parentId) {
      const assignmentValidation = GoalHierarchyService.validateParentAssignment(
        input.id,
        input.parentId,
        allGoals
      );
      if (!assignmentValidation.isValid) {
        throw new Error(assignmentValidation.error || 'انتساب والد نامعتبر است.');
      }
      hierarchyLevel = assignmentValidation.hierarchyLevel;
    }

    // اعتبارسنجی پیش‌نیازها و جلوگیری از دور
    if (input.blockedByGoalIds && input.blockedByGoalIds.length > 0) {
      GoalDependencyService.validateNoCycle(input.id, input.blockedByGoalIds, allGoals);
    }

    const updatedMetric = new MetricTarget({
      startValue: input.startValue,
      currentValue: existing.metric.currentValue,
      targetValue: input.targetValue,
      unit: input.unit
    });

    const newStatus = input.status || existing.status;
    const isNowActive = newStatus === 'active';
    const isNowCompleted = newStatus === 'completed';

    const updatedGoal = new Goal({
      id: existing.id,
      title: input.title,
      whyStatement: input.whyStatement,
      categoryId: input.categoryId || existing.categoryId,
      priority: input.priority,
      status: newStatus,
      targetStartDate: input.targetStartDate,
      actualStartDate: isNowActive && !existing.actualStartDate ? input.targetStartDate : existing.actualStartDate,
      deadline: input.deadline,
      actualEndDate: isNowCompleted ? (existing.actualEndDate || nowIso.slice(0, 10)) : undefined,
      metric: updatedMetric,
      isArchived: existing.isArchived,
      parentId: input.parentId || undefined,
      hierarchyLevel,
      weight: input.weight !== undefined ? input.weight : existing.weight,
      blockedByGoalIds: input.blockedByGoalIds || [],
      createdAt: existing.createdAt,
      updatedAt: nowIso
    });

    await this.goalRepo.save(updatedGoal);
    return updatedGoal;
  }
}
