import { IHabitRepository } from '@/domain/ports/IHabitRepository';
import { Habit } from '@/domain/entities/Habit';
import { HabitType } from '@/domain/value-objects/HabitType';
import { RecurrenceConfig } from '@/domain/value-objects/RecurrenceConfig';

export interface UpdateHabitInput {
  readonly id: string;
  readonly title: string;
  readonly icon?: string;
  readonly color?: string;
  readonly categoryId?: string;
  readonly habitType: HabitType;
  readonly recurrence: RecurrenceConfig;
  readonly dailyTarget: number;
  readonly unit: string;
  readonly cue?: string;
  readonly linkedGoalId?: string;
  readonly reminderTimes?: readonly string[];
  readonly weeklyFreezeAllowed?: boolean;
}

export class UpdateHabitUseCase {
  constructor(private readonly habitRepo: IHabitRepository) {}

  async execute(input: UpdateHabitInput): Promise<Habit> {
    const existing = await this.habitRepo.findById(input.id);
    if (!existing) {
      throw new Error(`عادت با شناسه ${input.id} یافت نشد.`);
    }

    const nowIso = new Date().toISOString();

    const updated = new Habit({
      id: existing.id,
      title: input.title,
      icon: input.icon || existing.icon,
      color: input.color || existing.color,
      categoryId: input.categoryId || existing.categoryId,
      habitType: input.habitType,
      recurrence: input.recurrence,
      dailyTarget: input.dailyTarget,
      unit: input.unit,
      cue: input.cue,
      linkedGoalId: input.linkedGoalId,
      reminderTimes: input.reminderTimes !== undefined ? input.reminderTimes : existing.reminderTimes,
      startDate: existing.startDate,
      endDate: existing.endDate,
      isPaused: existing.isPaused,
      isArchived: existing.isArchived,
      weeklyFreezeAllowed: input.weeklyFreezeAllowed !== undefined ? input.weeklyFreezeAllowed : existing.weeklyFreezeAllowed,
      createdAt: existing.createdAt,
      updatedAt: nowIso
    });

    await this.habitRepo.save(updated);
    return updated;
  }
}
