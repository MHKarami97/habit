import { HabitType } from '../value-objects/HabitType';
import { RecurrenceConfig } from '../value-objects/RecurrenceConfig';

export interface HabitProps {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly color: string;
  readonly categoryId: string;
  readonly habitType: HabitType;
  readonly recurrence: RecurrenceConfig;
  readonly dailyTarget: number;
  readonly unit: string;
  readonly cue?: string;
  readonly linkedGoalId?: string;
  readonly reminderTimes: readonly string[]; // Array of 'HH:mm'
  readonly startDate: string; // ISO date YYYY-MM-DD
  readonly endDate?: string; // ISO date YYYY-MM-DD
  readonly isPaused: boolean;
  readonly isArchived: boolean;
  readonly weeklyFreezeAllowed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class Habit {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly color: string;
  readonly categoryId: string;
  readonly habitType: HabitType;
  readonly recurrence: RecurrenceConfig;
  readonly dailyTarget: number;
  readonly unit: string;
  readonly cue?: string;
  readonly linkedGoalId?: string;
  readonly reminderTimes: readonly string[];
  readonly startDate: string;
  readonly endDate?: string;
  readonly isPaused: boolean;
  readonly isArchived: boolean;
  readonly weeklyFreezeAllowed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: HabitProps) {
    if (!props.id) throw new Error('شناسه عادت الزامی است');
    if (!props.title.trim()) throw new Error('عنوان عادت الزامی است');
    if (props.dailyTarget <= 0) throw new Error('هدف روزانه باید بزرگتر از صفر باشد');

    this.id = props.id;
    this.title = props.title.trim();
    this.icon = props.icon || 'star';
    this.color = props.color || '#D2532A';
    this.categoryId = props.categoryId || 'general';
    this.habitType = props.habitType;
    this.recurrence = props.recurrence;
    this.dailyTarget = props.dailyTarget;
    this.unit = props.unit.trim() || (props.habitType === 'boolean' ? 'بار' : 'واحد');
    this.cue = props.cue?.trim() || undefined;
    this.linkedGoalId = props.linkedGoalId || undefined;
    this.reminderTimes = props.reminderTimes || [];
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.isPaused = props.isPaused;
    this.isArchived = props.isArchived;
    this.weeklyFreezeAllowed = props.weeklyFreezeAllowed;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  togglePaused(updatedAtIso: string): Habit {
    return new Habit({
      ...this,
      isPaused: !this.isPaused,
      updatedAt: updatedAtIso
    });
  }

  toggleArchived(updatedAtIso: string): Habit {
    return new Habit({
      ...this,
      isArchived: !this.isArchived,
      updatedAt: updatedAtIso
    });
  }
}
