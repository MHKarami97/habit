/**
 * معماری سه‌لایه اعلان‌ها در پلتفرم کلاینت‌محور کاوش
 * لایه ۱: Notification Triggers (در صورت فعال بودن در مرورگر کاربر)
 * لایه ۲: App Badging API و هشدارهای درون‌برنامه‌ای
 * لایه ۳: خروجی تقویم استاندارد RFC 5545 (.ics) با هشدار صوتی/تصویری VALARM
 */

export interface NotificationCapabilities {
  readonly hasNotificationApi: boolean;
  readonly permission: NotificationPermission;
  readonly hasNotificationTriggers: boolean;
  readonly hasAppBadge: boolean;
  readonly isIosPwaInstalled: boolean;
}

export class NotificationService {
  /**
   * شناسایی قابلیت‌های مرورگر کلاینت (Feature Detection)
   */
  static getCapabilities(): NotificationCapabilities {
    const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
    const permission = hasNotification ? Notification.permission : 'denied';
    const hasTriggers = hasNotification && 'showTrigger' in Notification.prototype;
    const hasAppBadge = typeof navigator !== 'undefined' && 'setAppBadge' in navigator;

    // تشخیص iOS PWA (نصب‌شده روی صفحه اصلی در حالت standalone)
    const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone === true));
    const isIosPwaInstalled = isIos && isStandalone;

    return {
      hasNotificationApi: hasNotification,
      permission,
      hasNotificationTriggers: hasTriggers,
      hasAppBadge,
      isIosPwaInstalled
    };
  }

  /**
   * درخواست دسترسی به نوتیفیکیشن فقط در پی تعامل صریح کاربر (کلیک)
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return await Notification.requestPermission();
  }

  /**
   * ارسال اعلان فوری آزمایشی
   */
  static async showTestNotification(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return false;
    }

    try {
      new Notification('کاوش | یادآور آزمایشی', {
        body: 'سیستم اعلان محلی کاوش روی دستگاه شما فعال است.',
        icon: '/icons/launchericon-192x192.png',
        tag: 'kavosh-test'
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * تنظیم یا پاکسازی بج (Badge) روی آیکون برنامه در هوم‌اسکرین
   */
  static async updateAppBadge(unreadCount: number): Promise<void> {
    if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) return;
    try {
      if (unreadCount > 0) {
        await navigator.setAppBadge(unreadCount);
      } else {
        await (navigator as any).clearAppBadge?.();
      }
    } catch {
      // نادیده گرفتن خطای عدم پشتیبانی پلتفرم
    }
  }

  /**
   * تولید فایل استاندارد تقویم .ics همراه با VALARM برای انتقال یادآور به تقویم گوشی
   */
  static generateIcsContent(habitTitle: string, reminderTime: string): string {
    const [hh, mm] = reminderTime.split(':').map(Number);
    const now = new Date();
    const dtStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh ?? 20, mm ?? 0, 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatIcsTime = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const dtStamp = formatIcsTime(new Date());
    const dtStartStr = formatIcsTime(dtStart);
    const uid = `kavosh-${Date.now()}@local.device`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kavosh//Habit Tracker Local//FA',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStartStr}`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:یادآور عادت کاوش: ${habitTitle}`,
      `DESCRIPTION:موعد انجام عادت «${habitTitle}». جهت ثبت به اپ کاوش مراجعه کنید.`,
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:یادآور عادت ${habitTitle}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  /**
   * دانلود مستقیم فایل .ics تقویم
   */
  static downloadIcsFile(habitTitle: string, reminderTime: string): void {
    const content = NotificationService.generateIcsContent(habitTitle, reminderTime);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kavosh-reminder-${reminderTime.replace(':', '')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
