import { Habit } from '@/domain/entities/Habit';
import { RecurrenceConfig } from '@/domain/value-objects/RecurrenceConfig';
import { HabitRecord } from '../AppDatabase';

export class HabitMapper {
  static toDomain(record: HabitRecord): Habit {
    let recurrence: RecurrenceConfig;
    try {
      recurrence = JSON.parse(record.recurrenceRuleJson) as RecurrenceConfig;
    } catch {
      recurrence = { type: 'daily' };
    }

    let reminderTimes: string[] = [];
    try {
      reminderTimes = JSON.parse(record.reminderTimesJson) as string[];
    } catch {
      reminderTimes = [];
    }

    return new Habit({
      id: record.id,
      title: record.title,
      icon: record.icon,
      color: record.color,
      categoryId: record.categoryId,
      habitType: record.habitType,
      recurrence,
      dailyTarget: record.dailyTarget,
      unit: record.unit,
      cue: record.cue,
      linkedGoalId: record.linkedGoalId,
      reminderTimes,
      startDate: record.startDate,
      endDate: record.endDate,
      isPaused: record.isPaused === 1,
      isArchived: record.isArchived === 1,
      weeklyFreezeAllowed: record.weeklyFreezeAllowed === 1,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }

  static toPersistence(habit: Habit): HabitRecord {
    return {
      id: habit.id,
      title: habit.title,
      icon: habit.icon,
      color: habit.color,
      categoryId: habit.categoryId,
      habitType: habit.habitType,
      recurrenceType: habit.recurrence.type,
      recurrenceRuleJson: JSON.stringify(habit.recurrence),
      dailyTarget: habit.dailyTarget,
      unit: habit.unit,
      cue: habit.cue,
      linkedGoalId: habit.linkedGoalId,
      reminderTimesJson: JSON.stringify(habit.reminderTimes),
      startDate: habit.startDate,
      endDate: habit.endDate,
      isPaused: habit.isPaused ? 1 : 0,
      isArchived: habit.isArchived ? 1 : 0,
      weeklyFreezeAllowed: habit.weeklyFreezeAllowed ? 1 : 0,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt
    };
  }
}
