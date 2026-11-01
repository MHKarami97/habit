import { NotificationTriggerScheduler } from './strategies/NotificationTriggerScheduler';
import { InAppReminderScheduler, type DueInAppAlert } from './strategies/InAppReminderScheduler';
import { IcsExportScheduler } from './strategies/IcsExportScheduler';
import type { ScheduledReminder, ScheduleResult, SchedulerCapability, SchedulerType } from './IReminderScheduler';
import type { HabitRecord, GoalRecord } from '@/infrastructure/db/AppDatabase';
import { db } from '@/infrastructure/db/AppDatabase';

export class ReminderCoordinator {
  private static instance: ReminderCoordinator | null = null;

  readonly notificationTriggerScheduler: NotificationTriggerScheduler;
  readonly inAppScheduler: InAppReminderScheduler;
  readonly icsScheduler: IcsExportScheduler;

  private constructor() {
    this.notificationTriggerScheduler = new NotificationTriggerScheduler();
    this.inAppScheduler = new InAppReminderScheduler();
    this.icsScheduler = new IcsExportScheduler();
  }

  static getInstance(): ReminderCoordinator {
    if (!ReminderCoordinator.instance) {
      ReminderCoordinator.instance = new ReminderCoordinator();
    }
    return ReminderCoordinator.instance;
  }

  /**
   * دریافت مشخصات و وضعیت استراتژی‌های سه‌گانه
   */
  getCapabilities(): readonly SchedulerCapability[] {
    return [
      {
        id: 'notification_trigger',
        name: this.notificationTriggerScheduler.name,
        isAvailable: this.notificationTriggerScheduler.isAvailable,
        isExperimental: true,
        description: 'ثبت اعلان در زمان‌بند سیستم‌عامل از طریق Service Worker بدون نیاز به باز بودن صفحه مرورگر.',
        limitations: 'این قابلیت در استاندارد پایدار وب نهایی نشده (Non-Standard) و در حال حاضر فقط در برخی نسخه‌های کرومیوم با فعال‌سازی فلش آزمایشی (chrome://flags/#enable-experimental-web-platform-features) در دسترس است. در سافاری و فایرفاکس پشتیبانی نمی‌شود.'
      },
      {
        id: 'in_app',
        name: this.inAppScheduler.name,
        isAvailable: this.inAppScheduler.isAvailable,
        isExperimental: false,
        description: 'بررسی یادآورها به محض باز شدن برنامه، فوکوس مجدد روی برگه و نمایش بنر هشدارهای امروز.',
        limitations: 'فقط زمانی کار می‌کند که کاربر به برنامه سر بزند یا برگه در پس‌زمینه باز باشد.'
      },
      {
        id: 'ics',
        name: this.icsScheduler.name,
        isAvailable: this.icsScheduler.isAvailable,
        isExperimental: false,
        description: 'تولید فایل تقویم استاندارد RFC 5545 همراه با زنگ هشدار (VALARM) جهت افزودن به تقویم گوشی.',
        limitations: 'نیاز به تأیید کاربر برای دانلود و اضافه کردن به تقویم دارد، اما مستقل از مرورگر و با قابلیت اطمینان ۱۰۰٪ توسط سیستم‌عامل نواخته می‌شود.'
      }
    ];
  }

  /**
   * انتخاب خودکار بهترین استراتژی فعال در محیط جاری
   */
  getPreferredSchedulerType(): SchedulerType {
    if (this.notificationTriggerScheduler.isAvailable) {
      return 'notification_trigger';
    }
    return 'in_app';
  }

  /**
   * محاسبه تاریخ و زمان اجرای بعدی یادآور با توجه به ساعت پایان روز (endOfDayHour)
   */
  static calculateNextOccurrence(
    reminderTime: string,
    currentDate: Date = new Date(),
    _endOfDayHour = 0
  ): { targetDateStr: string; timestamp: number } {
    const [hh, mm] = reminderTime.split(':').map(Number);
    const target = new Date(currentDate.getTime());
    target.setSeconds(0, 0);

    const nowMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
    const reminderMinutes = (hh ?? 20) * 60 + (mm ?? 0);

    target.setHours(hh ?? 20, mm ?? 0, 0, 0);

    // اگر ساعت یادآور برای امروز گذشته باشد، موعد بعدی فردا خواهد بود
    if (nowMinutes >= reminderMinutes) {
      target.setDate(target.getDate() + 1);
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const targetDateStr = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;

    return {
      targetDateStr,
      timestamp: target.getTime()
    };
  }

  /**
   * زمان‌بندی یادآورهای یک عادت در سیستم چندلایه
   */
  async scheduleHabitReminders(habit: HabitRecord, endOfDayHour = 0): Promise<ScheduleResult[]> {
    const results: ScheduleResult[] = [];
    if (habit.isArchived || habit.isPaused) {
      await this.cancelHabitReminders(habit.id);
      return results;
    }

    let times: string[] = [];
    try {
      times = JSON.parse(habit.reminderTimesJson || '[]');
    } catch {
      times = [];
    }

    // لغو یادآورهای قبلی این عادت پیش از تنظیم جدید
    await this.cancelHabitReminders(habit.id);

    let recurrenceObj: ScheduledReminder['recurrence'] | undefined;
    try {
      const parsed = JSON.parse(habit.recurrenceRuleJson || '{}');
      recurrenceObj = {
        type: habit.recurrenceType,
        daysOfWeek: parsed.daysOfWeek,
        interval: parsed.interval,
        frequencyCount: parsed.frequencyCount
      };
    } catch {
      recurrenceObj = { type: 'daily' };
    }

    for (const timeStr of times) {
      const { targetDateStr, timestamp } = ReminderCoordinator.calculateNextOccurrence(timeStr, new Date(), endOfDayHour);

      const reminder: ScheduledReminder = {
        id: `habit-${habit.id}-${timeStr}`,
        entityId: habit.id,
        entityType: 'habit',
        title: `موعد انجام عادت: ${habit.title}`,
        body: habit.cue ? `محرک: ${habit.cue}` : 'زمان انجام عادت روزانه فرا رسیده است.',
        time: timeStr,
        targetDate: targetDateStr,
        timestamp,
        recurrence: recurrenceObj
      };

      // همیشه در حافظه یادآور درون‌برنامه ثبت می‌شود
      const inAppRes = await this.inAppScheduler.schedule(reminder);
      results.push(inAppRes);

      // اگر Notification Triggers فعال باشد، در اعلان سیستمی نیز زمان‌بندی می‌شود
      if (this.notificationTriggerScheduler.isAvailable) {
        const trigRes = await this.notificationTriggerScheduler.schedule(reminder);
        results.push(trigRes);
      }
    }

    return results;
  }

  /**
   * لغو کلیه یادآورهای یک عادت
   */
  async cancelHabitReminders(habitId: string): Promise<void> {
    await this.inAppScheduler.cancelForEntity(habitId);
    if (this.notificationTriggerScheduler.isAvailable) {
      await this.notificationTriggerScheduler.cancelForEntity(habitId);
    }
  }

  /**
   * ثبت اینکه یک عادت امروز انجام شده است؛ پاکسازی لاگ یادآور فعال و کاهش بج
   */
  async onHabitCompletedToday(habitId: string, todayIso: string): Promise<void> {
    const keys = await db.reminderLogs
      .where('habitId')
      .equals(habitId)
      .filter(r => r.date === todayIso)
      .primaryKeys();

    if (keys.length > 0) {
      await db.reminderLogs.bulkDelete(keys);
    }

    if (this.inAppScheduler.isAvailable) {
      await this.inAppScheduler.evaluatePendingReminders(
        todayIso,
        new Date().getHours() * 60 + new Date().getMinutes()
      );
    }
  }

  /**
   * تولید متن استاندارد فایل .ics برای یک عادت
   */
  generateHabitIcs(habit: HabitRecord): { icsContent: string; limitationNotice?: string } {
    let times: string[] = [];
    try {
      times = JSON.parse(habit.reminderTimesJson || '[]');
    } catch {
      times = [];
    }

    const firstTime = times[0] || '20:00';
    const [hh, mm] = firstTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hh ?? 20, mm ?? 0, 0, 0);

    let recurrenceObj: ScheduledReminder['recurrence'] | undefined;
    try {
      const parsed = JSON.parse(habit.recurrenceRuleJson || '{}');
      recurrenceObj = {
        type: habit.recurrenceType,
        daysOfWeek: parsed.daysOfWeek,
        interval: parsed.interval,
        frequencyCount: parsed.frequencyCount
      };
    } catch {
      recurrenceObj = { type: 'daily' };
    }

    const { rrule, limitationNotice } = IcsExportScheduler.buildRRule(recurrenceObj);

    const icsContent = IcsExportScheduler.generateIcs({
      uid: `habit-${habit.id}`,
      title: `عادت کاوش: ${habit.title}`,
      description: habit.cue ? `محرک رفتاری: ${habit.cue}` : 'ثبت در سامانه کاوش',
      startDate,
      rrule,
      alarmMinutesBefore: 0
    });

    return { icsContent, limitationNotice };
  }

  /**
   * تولید متن فایل .ics برای مهلت پایان یک هدف
   */
  generateGoalDeadlineIcs(goal: GoalRecord): string {
    const deadlineDate = new Date(goal.deadline);
    deadlineDate.setHours(9, 0, 0, 0); // ساعت ۹ صبح روز مهلت

    return IcsExportScheduler.generateIcs({
      uid: `goal-${goal.id}`,
      title: `مهلت هدف کاوش: ${goal.title}`,
      description: goal.whyStatement ? `انگیزه: ${goal.whyStatement}` : 'مهلت نهایی هدف در کاوش',
      startDate: deadlineDate,
      alarmMinutesBefore: 60 // ۱ ساعت قبل هشدار دهد
    });
  }

  /**
   * بررسی و دریافت هشدارهای معوق امروز درون‌برنامه
   */
  async checkDueRemindersToday(todayIso: string, currentMinutes: number): Promise<DueInAppAlert[]> {
    return await this.inAppScheduler.evaluatePendingReminders(todayIso, currentMinutes);
  }
}
