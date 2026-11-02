import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { ActionLog } from '@/domain/entities/ActionLog';

export interface UpdateActionLogInput {
  readonly id: string;
  readonly goalId: string;
  readonly date?: string;
  readonly description: string;
  readonly progressDelta: number;
  readonly durationMinutes: number;
  readonly nextStep?: string;
}

export class UpdateActionLogUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: UpdateActionLogInput): Promise<ActionLog> {
    const existingLogs = await this.goalRepo.findActionLogsByGoalId(input.goalId);
    const existing = existingLogs.find(l => l.id === input.id);
    if (!existing) {
      throw new Error(`اقدام با شناسه ${input.id} یافت نشد.`);
    }

    const updatedLog = new ActionLog({
      id: existing.id,
      goalId: existing.goalId,
      date: input.date || existing.date,
      description: input.description,
      progressDelta: input.progressDelta,
      durationMinutes: input.durationMinutes,
      nextStep: input.nextStep,
      createdAt: existing.createdAt
    });

    await this.goalRepo.saveActionLog(updatedLog);

    // محاسبه تفاوت پیشرفت و به‌روزرسانی سنجه هدف
    const deltaDiff = input.progressDelta - existing.progressDelta;
    if (deltaDiff !== 0) {
      const goal = await this.goalRepo.findById(input.goalId);
      if (goal) {
        const newCurrentVal = Math.max(0, goal.metric.currentValue + deltaDiff);
        const updatedGoal = goal.withMetricValue(newCurrentVal, new Date().toISOString());
        await this.goalRepo.save(updatedGoal);
      }
    }

    return updatedLog;
  }
}
