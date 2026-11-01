import { IHabitRepository } from '@/domain/ports/IHabitRepository';
import { IHabitLogRepository } from '@/domain/ports/IHabitLogRepository';
import { HabitLog } from '@/domain/entities/HabitLog';

export class ToggleFreezeHabitUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly habitLogRepo: IHabitLogRepository
  ) {}

  async execute(habitId: string, date: string): Promise<HabitLog> {
    const habit = await this.habitRepo.findById(habitId);
    if (!habit) throw new Error('عادت یافت نشد');
    if (!habit.weeklyFreezeAllowed) {
      throw new Error('برای این عادت امکان روز آزاد هفتگی (Freeze) تعریف نشده است');
    }

    const existing = await this.habitLogRepo.findByHabitAndDate(habitId, date);
    const nextFrozen = existing ? !existing.isFrozen : true;

    const log = new HabitLog({
      id: existing?.id || `hlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      habitId,
      date,
      value: existing?.value || 0,
      isCompleted: false, // روز فریز جایگزین تیک انجام است تا استریک حفظ شود
      isFrozen: nextFrozen,
      note: nextFrozen ? 'روز آزاد / استراحت مجاز (Freeze)' : undefined,
      createdAt: existing?.createdAt || new Date().toISOString()
    });

    await this.habitLogRepo.save(log);
    return log;
  }
}
