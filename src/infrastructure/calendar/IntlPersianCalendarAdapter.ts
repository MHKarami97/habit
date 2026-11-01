import { SolarDateMath, SolarDateTuple, SOLAR_MONTH_NAMES } from './SolarDateMath';

export interface PersianCalendarFormatOptions {
  readonly showTime?: boolean;
  readonly fullMonthName?: boolean;
  readonly includeWeekday?: boolean;
  readonly numberFormat?: 'persian' | 'latin';
}

export class IntlPersianCalendarAdapter {
  /**
   * محاسبه تاریخ روز «امروز» با در نظر گرفتن ساعت پایان روز (EndOfDayHour)
   * خروجی یک تاریخ استاندارد میلادی YYYY-MM-DD است که در دیتابیس ذخیره می‌شود.
   */
  static getEffectiveTodayIso(endOfDayHour = 0): string {
    const now = new Date();
    if (endOfDayHour > 0 && now.getHours() < endOfDayHour) {
      now.setDate(now.getDate() - 1);
    }
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * دریافت بخش‌های شمسی یک تاریخ میلادی
   */
  static getSolarDate(dateOrIso: Date | string, endOfDayHour = 0): SolarDateTuple {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    return SolarDateMath.dateToSolar(d, endOfDayHour);
  }

  /**
   * فرمت تاریخ میلادی به رشته خوانای فارسی (مثلاً «شنبه، ۱۲ اردیبهشت ۱۴۰۳»)
   */
  static formatPersian(
    dateOrIso: Date | string,
    options: PersianCalendarFormatOptions = {},
    endOfDayHour = 0
  ): string {
    const date = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(date.getTime())) return '';

    const adjusted = new Date(date);
    if (endOfDayHour > 0 && adjusted.getHours() < endOfDayHour) {
      adjusted.setDate(adjusted.getDate() - 1);
    }

    const solar = SolarDateMath.dateToSolar(adjusted, 0);
    const monthName = SOLAR_MONTH_NAMES[solar.month - 1] ?? '';
    const dayStr = options.numberFormat === 'latin' ? String(solar.day) : SolarDateMath.toPersianDigits(solar.day);
    const yearStr = options.numberFormat === 'latin' ? String(solar.year) : SolarDateMath.toPersianDigits(solar.year);

    let output = '';
    if (options.includeWeekday) {
      const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
      const weekdayName = weekdays[adjusted.getDay()] ?? '';
      output += `${weekdayName}، `;
    }

    output += `${dayStr} ${monthName} ${yearStr}`;

    if (options.showTime) {
      const hh = String(adjusted.getHours()).padStart(2, '0');
      const mm = String(adjusted.getMinutes()).padStart(2, '0');
      const timeStr = options.numberFormat === 'latin' ? `${hh}:${mm}` : SolarDateMath.toPersianDigits(`${hh}:${mm}`);
      output += ` ساعت ${timeStr}`;
    }

    return output;
  }

  /**
   * فرمت کوتاه تاریخ شمسی مثلاً «۱۴۰۳/۰۲/۱۲»
   */
  static formatShort(dateOrIso: Date | string, numberFormat: 'persian' | 'latin' = 'persian'): string {
    const solar = IntlPersianCalendarAdapter.getSolarDate(dateOrIso);
    const raw = SolarDateMath.formatSolarIso(solar);
    return numberFormat === 'latin' ? raw : SolarDateMath.toPersianDigits(raw);
  }
}
