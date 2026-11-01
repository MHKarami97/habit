export interface IRecurrenceStrategy {
  /**
   * آیا عادت در تاریخ مشخص‌شده موعد انجام دارد؟
   * @param date تاریخ مورد بررسی
   * @param weekStartDay روز آغاز هفته (پیش‌فرض ۰ = شنبه)
   */
  isDueOn(date: Date, weekStartDay?: number): boolean;

  /**
   * شرح متنی قاعده به زبان فارسی
   */
  describe(): string;
}
