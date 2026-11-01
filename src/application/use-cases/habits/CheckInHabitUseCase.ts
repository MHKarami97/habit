import { IHabitRepository } from '@/domain/ports/IHabitRepository';
import { IHabitLogRepository } from '@/domain/ports/IHabitLogRepository';
import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { HabitLog } from '@/domain/entities/HabitLog';

export interface CheckInHabitInput {
  readonly habitId: string;
  readonly date: string; // YYYY-MM-DD
  readonly customValue?: number;
  readonly note?: string;
}

export class CheckInHabitUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly habitLogRepo: IHabitLogRepository,
    private readonly goalRepo?: IGoalRepository
  ) {}

  async execute(input: CheckInHabitInput): Promise<HabitLog> {
    const habit = await this.habitRepo.findById(input.habitId);
    if (!habit) {
      throw new Error('عادت مورد نظر یافت نشد');
    }

    const existingLog = await this.habitLogRepo.findByHabitAndDate(input.habitId, input.date);

    let nextValue: number;
    let nextCompleted: boolean;

    if (habit.habitType === 'boolean' || habit.habitType === 'quit') {
      // حالت انجام شد / نشد: تاگل وضعیت با یک لمس
      if (existingLog && existingLog.isCompleted) {
        nextCompleted = false;
        nextValue = 0;
      } else {
        nextCompleted = true;
        nextValue = 1;
      }
    } else {
      // مقداری یا زمانی
      if (input.customValue !== undefined) {
        nextValue = input.customValue;
      } else {
        const curVal = existingLog ? existingLog.value : 0;
        nextValue = curVal + (habit.habitType === 'numeric' ? 1 : 15);
      }
      nextCompleted = nextValue >= habit.dailyTarget;
    }

    const log = new HabitLog({
      id: existingLog?.id || `hlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      habitId: input.habitId,
      date: input.date,
      value: nextValue,
      isCompleted: nextCompleted,
      isFrozen: false, // ثبت دستی، حالت فریز را حذف می‌کند
      note: input.note !== undefined ? input.note : existingLog?.note,
      createdAt: existingLog?.createdAt || new Date().toISOString()
    });

    await this.habitLogRepo.save(log);

    // سهم عادت در پیشرفت هدف مرتبط (در صورت اتصال)
    if (habit.linkedGoalId && this.goalRepo && nextCompleted && (!existingLog || !existingLog.isCompleted)) {
      const goal = await this.goalRepo.findById(habit.linkedGoalId);
      if (goal && goal.status === 'active') {
        const updatedGoal = goal.withMetricValue(
          goal.metric.currentValue + (habit.habitType === 'boolean' ? 1 : log.value),
          new Date().toISOString()
        );
        await this.goalRepo.save(updatedGoal);
      }
    }

    return log;
  }
}
