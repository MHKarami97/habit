import { IGoalRepository } from '@/domain/ports/IGoalRepository';

export interface DeleteActionLogInput {
  readonly id: string;
  readonly goalId: string;
}

export class DeleteActionLogUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: DeleteActionLogInput): Promise<void> {
    const existingLogs = await this.goalRepo.findActionLogsByGoalId(input.goalId);
    const existing = existingLogs.find(l => l.id === input.id);
    if (!existing) {
      throw new Error(`اقدام با شناسه ${input.id} یافت نشد.`);
    }

    await this.goalRepo.deleteActionLog(input.id);

    // بازگرداندن پیشرفت سنجه هدف در صورت حذف اقدام
    if (existing.progressDelta > 0) {
      const goal = await this.goalRepo.findById(input.goalId);
      if (goal) {
        const newCurrentVal = Math.max(0, goal.metric.currentValue - existing.progressDelta);
        const updatedGoal = goal.withMetricValue(newCurrentVal, new Date().toISOString());
        await this.goalRepo.save(updatedGoal);
      }
    }
  }
}
