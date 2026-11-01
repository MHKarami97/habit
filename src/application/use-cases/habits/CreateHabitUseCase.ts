import { IHabitRepository } from '@/domain/ports/IHabitRepository';
import { Habit } from '@/domain/entities/Habit';
import { HabitType } from '@/domain/value-objects/HabitType';
import { RecurrenceConfig } from '@/domain/value-objects/RecurrenceConfig';

export interface CreateHabitInput {
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
  readonly startDate: string;
  readonly endDate?: string;
  readonly weeklyFreezeAllowed?: boolean;
}

export class CreateHabitUseCase {
  constructor(private readonly habitRepo: IHabitRepository) {}

  async execute(input: CreateHabitInput): Promise<Habit> {
    const nowIso = new Date().toISOString();
    const id = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const habit = new Habit({
      id,
      title: input.title,
      icon: input.icon || 'star',
      color: input.color || '#D2532A',
      categoryId: input.categoryId || 'general',
      habitType: input.habitType,
      recurrence: input.recurrence,
      dailyTarget: input.dailyTarget,
      unit: input.unit,
      cue: input.cue,
      linkedGoalId: input.linkedGoalId,
      reminderTimes: input.reminderTimes || [],
      startDate: input.startDate,
      endDate: input.endDate,
      isPaused: false,
      isArchived: false,
      weeklyFreezeAllowed: input.weeklyFreezeAllowed ?? true,
      createdAt: nowIso,
      updatedAt: nowIso
    });

    await this.habitRepo.save(habit);
    return habit;
  }
}
