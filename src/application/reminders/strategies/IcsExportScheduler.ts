import type { IReminderScheduler, ScheduledReminder, ScheduleResult, SchedulerType } from '../IReminderScheduler';

export interface IcsEventOptions {
  readonly uid: string;
  readonly title: string;
  readonly description?: string;
  readonly startDate: Date;
  readonly durationMinutes?: number;
  readonly rrule?: string;
  readonly alarmMinutesBefore?: number;
}

/**
 * استراتژی ۳: خروجی فایل تقویم استاندارد RFC 5545 (.ics)
 * 
 * ویژگی‌های تطابق با استاندارد:
 * - شکستن خطوط بیش از ۷۵ بایت طبق RFC 5545 Section 3.1 (Line Folding) با محاسبه دقیق بایت‌های UTF-8
 * - فرار دادن نویسه‌های رزرو شده (ویرگول، سمیکولون، بک‌اسلش و خط جدید)
 * - تزریق هشدار صوتی/تصویری VALARM برای بیدار کردن سیستم یادآور تقویم گوشی
 * - ساخت RRULE استاندارد برای عادات روزانه و روزهای هفته
 */
export class IcsExportScheduler implements IReminderScheduler {
  readonly id: SchedulerType = 'ics';
  readonly name = 'تقویم استاندارد گوشی (.ics / RFC 5545)';
  readonly isExperimental = false;

  get isAvailable(): boolean {
    return true; // همیشه روی کلاینت قابل تولید و دانلود است
  }

  async schedule(_reminder: ScheduledReminder): Promise<ScheduleResult> {
    return {
      success: true,
      schedulerType: this.id,
      message: 'خروجی تقویم آماده دانلود و ثبت در تقویم دستگاه است.'
    };
  }

  async cancel(_reminderId: string): Promise<boolean> {
    return true;
  }

  async cancelForEntity(_entityId: string): Promise<void> {
    // رویدادهای تقویم داخل اپ تقویم کاربر قرار دارند
  }

  async cancelAll(): Promise<void> {
    // رویدادهای تقویم خارج از دسترس وب هستند
  }

  /**
   * فرار دادن نویسه‌های خاص طبق RFC 5545 Section 3.3.11
   */
  static escapeIcsText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  /**
   * شکستن خطوط طولانی‌تر از ۷۵ بایت UTF-8 طبق RFC 5545 Section 3.1
   */
  static foldLine(line: string, maxBytes = 75): string {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(line);

    if (encoded.length <= maxBytes) {
      return line;
    }

    const chunks: string[] = [];
    let currentChunk = '';
    let currentByteLength = 0;
    const isFirstLine = chunks.length === 0;

    // پیمایش کاراکتر به کاراکتر برای جلوگیری از شکستن نویسه‌های چندبایتی یونیکد
    for (const char of line) {
      const charBytes = encoder.encode(char).length;
      const limit = isFirstLine && chunks.length === 0 ? maxBytes : maxBytes - 1; // خط‌های بعدی ۱ بایت اسپیس فاصله اولیه دارند

      if (currentByteLength + charBytes > limit) {
        chunks.push(currentChunk);
        currentChunk = char;
        currentByteLength = charBytes;
      } else {
        currentChunk += char;
        currentByteLength += charBytes;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    // اتصال با CRLF و یک نویسه فاصله برای خط‌های بعدی
    return chunks.join('\r\n ');
  }

  /**
   * قالب‌بندی زمان به استاندارد UTC یا محلی iCalendar: YYYYMMDDTHHmmss
   */
  static formatIcsDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  /**
   * تبدیل قاعده تکرار به رشته استاندارد RRULE
   */
  static buildRRule(recurrence?: ScheduledReminder['recurrence']): { rrule?: string; limitationNotice?: string } {
    if (!recurrence) {
      return {};
    }

    if (recurrence.type === 'daily') {
      return { rrule: 'RRULE:FREQ=DAILY' };
    }

    if (recurrence.type === 'weekly_days' && recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      // نگاشت روزهای هفته کاوش (۰ = شنبه) به نمادهای دوحرفی RFC 5545
      const dayMap: Record<number, string> = {
        0: 'SA',
        1: 'SU',
        2: 'MO',
        3: 'TU',
        4: 'WE',
        5: 'TH',
        6: 'FR'
      };
      const byDays = recurrence.daysOfWeek.map(d => dayMap[d]).filter(Boolean).join(',');
      return { rrule: `RRULE:FREQ=WEEKLY;BYDAY=${byDays}` };
    }

    if (recurrence.type === 'interval' && recurrence.interval && recurrence.interval > 1) {
      return { rrule: `RRULE:FREQ=DAILY;INTERVAL=${recurrence.interval}` };
    }

    if (recurrence.type === 'frequency') {
      // استاندارد RFC 5545 قاعده‌ای برای «n بار در هفته بدون روز معین» ندارد
      return {
        rrule: 'RRULE:FREQ=DAILY',
        limitationNotice: `این عادت دارای قاعده «${recurrence.frequencyCount || 'چند'} بار در هفته» است. استاندارد تقویم RFC 5545 از تکرار شناور بدون روز مشخص پشتیبانی نمی‌کند؛ از این رو یادآور به‌صورت روزانه درج شده است.`
      };
    }

    return { rrule: 'RRULE:FREQ=DAILY' };
  }

  /**
   * تولید متن کامل فایل .ics برای یک عادت یا هدف
   */
  static generateIcs(options: IcsEventOptions): string {
    const dtStamp = IcsExportScheduler.formatIcsDateTime(new Date());
    const dtStart = IcsExportScheduler.formatIcsDateTime(options.startDate);
    const duration = options.durationMinutes ?? 15;
    const endDate = new Date(options.startDate.getTime() + duration * 60000);
    const dtEnd = IcsExportScheduler.formatIcsDateTime(endDate);

    const escapedSummary = IcsExportScheduler.escapeIcsText(options.title);
    const escapedDesc = IcsExportScheduler.escapeIcsText(options.description || '');

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kavosh Habit Goal//FA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${options.uid}@kavosh.local`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapedSummary}`
    ];

    if (escapedDesc) {
      lines.push(`DESCRIPTION:${escapedDesc}`);
    }

    if (options.rrule) {
      lines.push(options.rrule);
    }

    // اضافه کردن هشدار صوتی و تصویری VALARM
    const alarmMinutes = options.alarmMinutesBefore ?? 0;
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:یادآور: ${escapedSummary}`,
      `TRIGGER:-PT${alarmMinutes}M`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    );

    // اعمال شکستن خطوط بیش از ۷۵ بایت روی تمام سطرها
    return lines.map(line => IcsExportScheduler.foldLine(line)).join('\r\n');
  }

  /**
   * دانلود مستقیم فایل .ics
   */
  static downloadIcsFile(fileName: string, icsContent: string): void {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.ics') ? fileName : `${fileName}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
