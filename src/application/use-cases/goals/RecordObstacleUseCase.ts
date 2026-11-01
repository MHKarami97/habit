import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { ObstacleLog, ObstacleCategory } from '@/domain/entities/ObstacleLog';

export interface RecordObstacleInput {
  readonly goalId: string;
  readonly date: string;
  readonly category: ObstacleCategory;
  readonly customCategory?: string;
  readonly note: string;
  readonly ifThenPlan: string;
}

export class RecordObstacleUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: RecordObstacleInput): Promise<ObstacleLog> {
    const goal = await this.goalRepo.findById(input.goalId);
    if (!goal) {
      throw new Error('هدف مورد نظر یافت نشد');
    }

    const obstacle = new ObstacleLog({
      id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      goalId: input.goalId,
      date: input.date,
      category: input.category,
      customCategory: input.customCategory,
      note: input.note,
      ifThenPlan: input.ifThenPlan,
      createdAt: new Date().toISOString()
    });

    await this.goalRepo.saveObstacleLog(obstacle);
    return obstacle;
  }
}
