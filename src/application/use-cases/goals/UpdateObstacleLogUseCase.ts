import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { ObstacleLog, ObstacleCategory } from '@/domain/entities/ObstacleLog';

export interface UpdateObstacleLogInput {
  readonly id: string;
  readonly goalId: string;
  readonly date?: string;
  readonly category: ObstacleCategory;
  readonly customCategory?: string;
  readonly note: string;
  readonly ifThenPlan: string;
}

export class UpdateObstacleLogUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: UpdateObstacleLogInput): Promise<ObstacleLog> {
    const existingLogs = await this.goalRepo.findObstacleLogsByGoalId(input.goalId);
    const existing = existingLogs.find(o => o.id === input.id);
    if (!existing) {
      throw new Error(`مانع با شناسه ${input.id} یافت نشد.`);
    }

    const updated = new ObstacleLog({
      id: existing.id,
      goalId: existing.goalId,
      date: input.date || existing.date,
      category: input.category,
      customCategory: input.category === 'custom' ? input.customCategory : undefined,
      note: input.note,
      ifThenPlan: input.ifThenPlan,
      createdAt: existing.createdAt
    });

    await this.goalRepo.saveObstacleLog(updated);
    return updated;
  }
}
