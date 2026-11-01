import type { IReminderScheduler, ScheduledReminder, ScheduleResult, SchedulerType } from '../IReminderScheduler';

/**
 * استراتژی ۱: Notification Triggers (آزمایشی / Experimental)
 * 
 * مستندات مرجع و وضعیت پشتیبانی استاندارد:
 * - MDN Web Docs: Notification.showTrigger (Experimental technology, non-standard)
 * - Chrome for Developers / Chrome Platform Status (#5735397495046144):
 *   این ویژگی پس از دوره‌ی Origin Trial، به عنوان استاندارد پایدار وب نهایی نشده و تنها در صورت
 *   فعال‌بودن فلگ آزمایشی مرورگر (chrome://flags/#enable-experimental-web-platform-features) در دسترس است.
 *   در مرورگرهای سافاری (WebKit) و فایرفاکس (Gecko) به هیچ وجه پشتیبانی نمی‌شود.
 */
export class NotificationTriggerScheduler implements IReminderScheduler {
  readonly id: SchedulerType = 'notification_trigger';
  readonly name = 'اعلان زمان‌بندی‌شده سیستمی (Notification Triggers)';
  readonly isExperimental = true;

  get isAvailable(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    const hasTriggerProp = 'showTrigger' in Notification.prototype;
    const hasTimestampTrigger = typeof (window as any).TimestampTrigger !== 'undefined';
    const isGranted = Notification.permission === 'granted';
    const hasServiceWorker = 'serviceWorker' in navigator;
    return hasTriggerProp && hasTimestampTrigger && isGranted && hasServiceWorker;
  }

  async schedule(reminder: ScheduledReminder): Promise<ScheduleResult> {
    if (!this.isAvailable) {
      return {
        success: false,
        schedulerType: this.id,
        error: 'قابلیت آزمایشی Notification Triggers در این مرورگر فعال یا مجاز نیست.'
      };
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const TimestampTriggerClass = (window as any).TimestampTrigger;

      // ساخت Trigger با زمان هدف میلی‌ثانیه
      const trigger = new TimestampTriggerClass(reminder.timestamp);

      await reg.showNotification(reminder.title, {
        tag: reminder.id,
        body: reminder.body,
        icon: reminder.icon || '/icons/launchericon-192x192.png',
        badge: '/icons/launchericon-96x96.png',
        dir: 'rtl',
        lang: 'fa-IR',
        data: {
          entityId: reminder.entityId,
          entityType: reminder.entityType,
          targetDate: reminder.targetDate
        },
        showTrigger: trigger
      } as any);

      return {
        success: true,
        schedulerType: this.id,
        message: `اعلان آزمایشی برای ساعت ${reminder.time} با موفقیت در صف سیستم‌عامل قرار گرفت.`
      };
    } catch (err: any) {
      return {
        success: false,
        schedulerType: this.id,
        error: `خطا در ثبت اعلان سیستمی: ${err?.message || String(err)}`
      };
    }
  }

  async cancel(reminderId: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const notifications = await reg.getNotifications({ tag: reminderId, includeTriggered: true } as any);
      for (const n of notifications) {
        n.close();
      }
      return true;
    } catch {
      return false;
    }
  }

  async cancelForEntity(entityId: string): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const notifications = await reg.getNotifications({ includeTriggered: true } as any);
      for (const n of notifications) {
        if (n.data?.entityId === entityId) {
          n.close();
        }
      }
    } catch {
      // نادیده گرفتن خطاهای مرورگر در حالت پس‌زمینه
    }
  }

  async cancelAll(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const notifications = await reg.getNotifications({ includeTriggered: true } as any);
      for (const n of notifications) {
        n.close();
      }
    } catch {
      // نادیده گرفتن خطا
    }
  }
}
