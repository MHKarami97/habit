import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { Goal } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import { GoalPriority } from '@/domain/value-objects/GoalPriority';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';

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
}

export class CreateGoalUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: CreateGoalInput): Promise<Goal> {
    const nowIso = new Date().toISOString();
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
      createdAt: nowIso,
      updatedAt: nowIso
    });

    await this.goalRepo.save(goal);
    return goal;
  }
}
