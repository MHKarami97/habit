export type RecurrenceType = 'daily' | 'weekly_days' | 'frequency' | 'interval';

export interface DailyRecurrenceConfig {
  readonly type: 'daily';
}

export interface WeeklyDaysRecurrenceConfig {
  readonly type: 'weekly_days';
  /** 0 = شنبه, 1 = یکشنبه, ..., 6 = جمعه */
  readonly daysOfWeek: readonly number[];
}

export interface FrequencyPeriodRecurrenceConfig {
  readonly type: 'frequency';
  readonly count: number; // مثلا ۳ بار
  readonly period: 'week' | 'month'; // در هفته یا ماه
}

export interface IntervalDaysRecurrenceConfig {
  readonly type: 'interval';
  readonly everyXDays: number; // مثلا هر ۲ روز یکبار
  readonly anchorDate: string; // تاریخ مبدا YYYY-MM-DD
}

export type RecurrenceConfig =
  | DailyRecurrenceConfig
  | WeeklyDaysRecurrenceConfig
  | FrequencyPeriodRecurrenceConfig
  | IntervalDaysRecurrenceConfig;

export function getRecurrenceTypeLabel(type: RecurrenceType): string {
  switch (type) {
    case 'daily':
      return 'هر روز';
    case 'weekly_days':
      return 'روزهای مشخص هفته';
    case 'frequency':
      return 'تعداد مشخص در دوره';
    case 'interval':
      return 'فاصله چند روز یک‌بار';
  }
}
