export interface HabitLogProps {
  readonly id: string;
  readonly habitId: string;
  readonly date: string; // YYYY-MM-DD
  readonly value: number;
  readonly isCompleted: boolean;
  readonly isFrozen: boolean;
  readonly note?: string;
  readonly createdAt: string;
}

export class HabitLog {
  readonly id: string;
  readonly habitId: string;
  readonly date: string;
  readonly value: number;
  readonly isCompleted: boolean;
  readonly isFrozen: boolean;
  readonly note?: string;
  readonly createdAt: string;

  constructor(props: HabitLogProps) {
    if (!props.id) throw new Error('شناسه لاگ عادت الزامی است');
    if (!props.habitId) throw new Error('شناسه عادت الزامی است');
    if (!props.date) throw new Error('تاریخ لاگ الزامی است');

    this.id = props.id;
    this.habitId = props.habitId;
    this.date = props.date;
    this.value = Math.max(0, props.value);
    this.isCompleted = props.isCompleted;
    this.isFrozen = props.isFrozen;
    this.note = props.note?.trim() || undefined;
    this.createdAt = props.createdAt;
  }
}
