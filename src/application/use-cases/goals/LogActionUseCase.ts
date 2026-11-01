import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { ActionLog } from '@/domain/entities/ActionLog';

export interface LogActionInput {
  readonly goalId: string;
  readonly date: string;
  readonly description: string;
  readonly progressDelta: number;
  readonly durationMinutes: number;
  readonly nextStep?: string;
}

export class LogActionUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: LogActionInput): Promise<ActionLog> {
    const goal = await this.goalRepo.findById(input.goalId);
    if (!goal) {
      throw new Error('هدف مورد نظر یافت نشد');
    }

    const actionLog = new ActionLog({
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      goalId: input.goalId,
      date: input.date,
      description: input.description,
      progressDelta: input.progressDelta,
      durationMinutes: input.durationMinutes,
      nextStep: input.nextStep,
      createdAt: new Date().toISOString()
    });

    await this.goalRepo.saveActionLog(actionLog);

    // به‌روزرسانی خودکار مقدار فعلی سنجه هدف
    if (input.progressDelta !== 0) {
      const updatedGoal = goal.withMetricValue(
        goal.metric.currentValue + input.progressDelta,
        new Date().toISOString()
      );
      await this.goalRepo.save(updatedGoal);
    }

    return actionLog;
  }
}
