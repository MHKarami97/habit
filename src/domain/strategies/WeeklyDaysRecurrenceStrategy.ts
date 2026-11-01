import { IRecurrenceStrategy } from './IRecurrenceStrategy';

export const PERSIAN_WEEK_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه'
] as const;

export class WeeklyDaysRecurrenceStrategy implements IRecurrenceStrategy {
  /**
   * @param daysOfWeek آرایه‌ای از اعداد ۰ تا ۶ (۰=شنبه، ۶=جمعه)
   */
  constructor(public readonly daysOfWeek: readonly number[]) {}

  isDueOn(date: Date): boolean {
    if (this.daysOfWeek.length === 0) return false;
    // تبدیل روز میلادی Date.getDay() به شاخص تقویم هجری شمسی (شنبه = 0)
    const persianDayIndex = (date.getDay() + 1) % 7;
    return this.daysOfWeek.includes(persianDayIndex);
  }

  describe(): string {
    if (this.daysOfWeek.length === 7) return 'هر روز هفته';
    if (this.daysOfWeek.length === 0) return 'هیچ روزی';
    const dayNames = this.daysOfWeek
      .slice()
      .sort((a, b) => a - b)
      .map(idx => PERSIAN_WEEK_DAYS[idx])
      .filter(Boolean);
    return `روزهای ${dayNames.join('، ')}`;
  }
}
