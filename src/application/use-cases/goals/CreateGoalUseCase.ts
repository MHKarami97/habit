import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { Goal, type GoalHierarchyLevel } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import { GoalPriority } from '@/domain/value-objects/GoalPriority';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { GoalHierarchyService } from '@/domain/services/GoalHierarchyService';
import { GoalDependencyService } from '@/domain/services/GoalDependencyService';

export interface CreateGoalInput {
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
  readonly hierarchyLevel?: GoalHierarchyLevel;
  readonly weight?: number;
  readonly blockedByGoalIds?: readonly string[];
}

export class CreateGoalUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: CreateGoalInput): Promise<Goal> {
    const allGoals = await this.goalRepo.findAll();
    const nowIso = new Date().toISOString();
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // اعتبارسنجی سلسله‌مراتب و عمق حداکثر ۳ سطح
    let hierarchyLevel: GoalHierarchyLevel = input.hierarchyLevel || 1;
    if (input.parentId) {
      const assignmentValidation = GoalHierarchyService.validateParentAssignment(
        undefined,
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
      GoalDependencyService.validateNoCycle(id, input.blockedByGoalIds, allGoals);
    }

    const goal = new Goal({
      id,
      title: input.title,
      whyStatement: input.whyStatement,
      categoryId: input.categoryId || 'general',
      priority: input.priority,
      status: input.status || 'draft',
      targetStartDate: input.targetStartDate,
      actualStartDate: input.status === 'active' ? input.targetStartDate : undefined,
      deadline: input.deadline,
      metric: new MetricTarget({
        startValue: input.startValue,
        currentValue: input.startValue,
        targetValue: input.targetValue,
        unit: input.unit
      }),
      isArchived: false,
      parentId: input.parentId,
      hierarchyLevel,
      weight: input.weight !== undefined ? input.weight : 1,
      blockedByGoalIds: input.blockedByGoalIds || [],
      createdAt: nowIso,
      updatedAt: nowIso
    });

    await this.goalRepo.save(goal);
    return goal;
  }
}
