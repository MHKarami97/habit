import type { IReminderScheduler, ScheduledReminder, ScheduleResult, SchedulerType } from '../IReminderScheduler';
import { db } from '@/infrastructure/db/AppDatabase';
import { NotificationService } from '@/infrastructure/notifications/NotificationService';

export interface DueInAppAlert {
  readonly id: string;
  readonly entityId: string;
  readonly entityType: 'habit' | 'goal';
  readonly title: string;
  readonly body: string;
  readonly time: string;
  readonly targetDate: string;
}

export type InAppAlertListener = (alerts: readonly DueInAppAlert[]) => void;

/**
 * استراتژی ۲: یادآور درون‌برنامه (In-App Reminder)
 * کارکرد بر پایه رویدادهای Focus، Visibility Change و Heartbeat دوره‌ای.
 * با بررسی لاگ‌های پیشین مانع از نمایش تکراری می‌شود و بج آیکون برنامه را به‌روز می‌کند.
 */
export class InAppReminderScheduler implements IReminderScheduler {
  readonly id: SchedulerType = 'in_app';
  readonly name = 'یادآور درون‌برنامه‌ای و هنگام فوکوس';
  readonly isExperimental = false;

  private reminders = new Map<string, ScheduledReminder>();
  private listeners = new Set<InAppAlertListener>();
  private intervalTimer: number | null = null;
  private isListeningToDom = false;

  get isAvailable(): boolean {
    return typeof window !== 'undefined';
  }

  constructor() {
    this.setupLifecycleListeners();
  }

  /**
   * افزودن شنونده برای دریافت هشدارهای فعال درون‌برنامه
   */
  subscribe(listener: InAppAlertListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(alerts: readonly DueInAppAlert[]): void {
    for (const listener of this.listeners) {
      listener(alerts);
    }
  }

  async schedule(reminder: ScheduledReminder): Promise<ScheduleResult> {
    this.reminders.set(reminder.id, reminder);
    return {
      success: true,
      schedulerType: this.id,
      message: `یادآور درون‌برنامه برای ساعت ${reminder.time} تنظیم شد.`
    };
  }

  async cancel(reminderId: string): Promise<boolean> {
    return this.reminders.delete(reminderId);
  }

  async cancelForEntity(entityId: string): Promise<void> {
    for (const [id, rem] of this.reminders.entries()) {
      if (rem.entityId === entityId) {
        this.reminders.delete(id);
      }
    }
  }

  async cancelAll(): Promise<void> {
    this.reminders.clear();
  }

  /**
   * بررسی تمام یادآورهای امروز که ساعت آن‌ها فرارسیده و هنوز تیک نخورده‌اند
   */
  async evaluatePendingReminders(currentIsoDate: string, currentMinutesSinceMidnight: number): Promise<DueInAppAlert[]> {
    const dueAlerts: DueInAppAlert[] = [];

    // واکشی عادات فعال از دیتابیس
    const habits = await db.habits.where('isArchived').equals(0).toArray();

    for (const habit of habits) {
      if (habit.isPaused) continue;

      let times: string[] = [];
      try {
        times = JSON.parse(habit.reminderTimesJson || '[]');
      } catch {
        times = [];
      }

      for (const timeStr of times) {
        const [hh, mm] = timeStr.split(':').map(Number);
        if (hh === undefined || mm === undefined) continue;
        const reminderMinutes = hh * 60 + mm;

        // اگر زمان یادآور در روز جاری گذشته باشد
        if (reminderMinutes <= currentMinutesSinceMidnight) {
          // بررسی اینکه آیا امروز ثبت/انجام شده است یا خیر
          const log = await db.habitLogs.get({ habitId: habit.id, date: currentIsoDate } as any);
          if (log && log.isCompleted === 1) {
            continue; // عادت امروز کامل شده، یادآور ارسال نمی‌شود
          }

          // بررسی پیشگیری از ارسال تکراری از طریق جدول reminderLogs
          const alreadyFired = await db.reminderLogs
            .where('[habitId+date+time]')
            .equals([habit.id, currentIsoDate, timeStr])
            .first();

          if (!alreadyFired) {
            dueAlerts.push({
              id: `inapp-${habit.id}-${currentIsoDate}-${timeStr}`,
              entityId: habit.id,
              entityType: 'habit',
              title: `موعد عادت: ${habit.title}`,
              body: habit.cue ? `محرک: ${habit.cue}` : 'فرصت مناسبی برای انجام این عادت است.',
              time: timeStr,
              targetDate: currentIsoDate
            });

            // ثبت در دیتابیس جهت جلوگیری از اسپم و تکرار در دفعات بعدی فوکوس
            await db.reminderLogs.put({
              id: `${habit.id}-${currentIsoDate}-${timeStr}`,
              habitId: habit.id,
              date: currentIsoDate,
              time: timeStr,
              firedAt: new Date().toISOString()
            });
          }
        }
      }
    }

    if (dueAlerts.length > 0) {
      this.notifyListeners(dueAlerts);
    }

    // به‌روزرسانی بج برنامه در هوم‌اسکرین بر اساس تعداد هشدارهای در انتظار
    await NotificationService.updateAppBadge(dueAlerts.length);

    return dueAlerts;
  }

  private setupLifecycleListeners(): void {
    if (typeof window === 'undefined' || this.isListeningToDom) return;
    this.isListeningToDom = true;

    const onAppWake = () => {
      const now = new Date();
      const currentIso = now.toISOString().slice(0, 10);
      const minutes = now.getHours() * 60 + now.getMinutes();
      this.evaluatePendingReminders(currentIso, minutes).catch(() => {});
    };

    window.addEventListener('focus', onAppWake);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        onAppWake();
      }
    });

    // بررسی چرخشی هر ۶۰ ثانیه در زمان باز بودن صفحه
    this.intervalTimer = window.setInterval(onAppWake, 60000);
  }

  destroy(): void {
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.listeners.clear();
    this.reminders.clear();
  }
}
