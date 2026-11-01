/**
 * لایه انتزاعی سیستم یادآورها در کاوش
 * شامل تایپ‌ها و اینترفیس استاندارد برای پیاده‌سازی استراتژی‌های سه‌گانه
 */

export interface ScheduledReminder {
  readonly id: string; // شناسه یکتای یادآور: `habit-${habitId}-${time}` یا `goal-${goalId}`
  readonly entityId: string;
  readonly entityType: 'habit' | 'goal';
  readonly title: string;
  readonly body: string;
  readonly time: string; // "HH:mm"
  readonly targetDate: string; // "YYYY-MM-DD"
  readonly timestamp: number; // زمان اجرا بر حسب میلی‌ثانیه epoch
  readonly icon?: string;
  readonly recurrence?: {
    readonly type: 'daily' | 'weekly_days' | 'frequency' | 'interval';
    readonly daysOfWeek?: readonly number[]; // [0, 1, 2, ...] که 0 = شنبه
    readonly interval?: number;
    readonly frequencyCount?: number;
  };
}

export type SchedulerType = 'notification_trigger' | 'in_app' | 'ics';

export interface ScheduleResult {
  readonly success: boolean;
  readonly schedulerType: SchedulerType;
  readonly message?: string;
  readonly error?: string;
}

export interface SchedulerCapability {
  readonly id: SchedulerType;
  readonly name: string;
  readonly isAvailable: boolean;
  readonly isExperimental: boolean;
  readonly description: string;
  readonly limitations: string;
}

export interface IReminderScheduler {
  readonly id: SchedulerType;
  readonly name: string;
  readonly isAvailable: boolean;
  readonly isExperimental: boolean;

  /**
   * زمان‌بندی یادآور مشخص
   */
  schedule(reminder: ScheduledReminder): Promise<ScheduleResult>;

  /**
   * لغو یک یادآور بر اساس شناسه
   */
  cancel(reminderId: string): Promise<boolean>;

  /**
   * لغو تمام یادآورهای مربوط به یک عادت یا هدف
   */
  cancelForEntity(entityId: string): Promise<void>;

  /**
   * لغو کل یادآورها
   */
  cancelAll(): Promise<void>;
}
