export interface Holiday {
  readonly date: string; // ISO date YYYY-MM-DD
  readonly title: string;
  readonly isOfficialOff: boolean;
}

/**
 * اینترفیس آماده‌سازی‌شده جهت الحاق ارائه‌دهنده تعطیلات رسمی تقویم شمسی در فازهای بعدی
 */
export interface IHolidayProvider {
  /**
   * بررسی آیا تاریخ مورد نظر تعطیل رسمی است یا خیر
   */
  isHoliday(dateIso: string): Promise<boolean>;

  /**
   * دریافت لیست تعطیلات در یک بازه تاریخی مشخص
   */
  getHolidaysInRange(startDateIso: string, endDateIso: string): Promise<readonly Holiday[]>;
}
