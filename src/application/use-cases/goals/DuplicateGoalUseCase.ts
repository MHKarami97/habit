import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { Goal } from '@/domain/entities/Goal';

export class DuplicateGoalUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(sourceGoalId: string): Promise<Goal> {
    const source = await this.goalRepo.findById(sourceGoalId);
    if (!source) {
      throw new Error('هدف مبدأ یافت نشد');
    }

    const nowIso = new Date().toISOString();
    const newId = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const duplicatedGoal = new Goal({
      id: newId,
      title: `${source.title} (کپی)`,
      whyStatement: source.whyStatement,
      categoryId: source.categoryId,
      priority: source.priority,
      status: 'draft', // هدف تکثیر شده همیشه از پیش‌نویس آغاز می‌شود
      targetStartDate: source.targetStartDate,
      deadline: source.deadline,
      metric: source.metric.withCurrentValue(source.metric.startValue),
      isArchived: false,
      createdAt: nowIso,
      updatedAt: nowIso
    });

    await this.goalRepo.save(duplicatedGoal);
    return duplicatedGoal;
  }
}
