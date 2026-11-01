import { IHabitRepository } from '@/domain/ports/IHabitRepository';
import { IHabitLogRepository } from '@/domain/ports/IHabitLogRepository';
import { HabitLog } from '@/domain/entities/HabitLog';

export interface BackfillHabitLogInput {
  readonly habitId: string;
  readonly date: string; // YYYY-MM-DD
  readonly isCompleted: boolean;
  readonly value?: number;
  readonly note?: string;
  readonly maxPastDaysAllowed?: number; // محدودیت مجاز گذشته‌نگاری
  readonly todayIso: string;
}

export class BackfillHabitLogUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly habitLogRepo: IHabitLogRepository
  ) {}

  async execute(input: BackfillHabitLogInput): Promise<HabitLog> {
    const habit = await this.habitRepo.findById(input.habitId);
    if (!habit) throw new Error('عادت یافت نشد');

    // بررسی سقف گذشته‌نگاری (Backfill limit)
    const limitDays = input.maxPastDaysAllowed ?? 14;
    const targetDate = new Date(input.date).getTime();
    const today = new Date(input.todayIso).getTime();
    const diffDays = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      throw new Error('نمی‌توان برای روزهای آینده ثبت انجام داد');
    }
    if (diffDays > limitDays) {
      throw new Error(`ثبت روزهای گذشته حداکثر تا ${limitDays} روز قبل امکان‌پذیر است`);
    }

    const existingLog = await this.habitLogRepo.findByHabitAndDate(input.habitId, input.date);
    const log = new HabitLog({
      id: existingLog?.id || `hlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      habitId: input.habitId,
      date: input.date,
      value: input.value !== undefined ? input.value : (input.isCompleted ? habit.dailyTarget : 0),
      isCompleted: input.isCompleted,
      isFrozen: false,
      note: input.note,
      createdAt: existingLog?.createdAt || new Date().toISOString()
    });

    await this.habitLogRepo.save(log);
    return log;
  }
}
