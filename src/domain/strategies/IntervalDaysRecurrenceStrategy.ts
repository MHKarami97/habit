import { IRecurrenceStrategy } from './IRecurrenceStrategy';

export class IntervalDaysRecurrenceStrategy implements IRecurrenceStrategy {
  constructor(
    public readonly everyXDays: number,
    public readonly anchorDateIso: string
  ) {}

  isDueOn(date: Date): boolean {
    if (this.everyXDays <= 0) return true;
    const anchor = new Date(this.anchorDateIso);
    // نرمال‌سازی ساعت برای جلوگیری از خطای Daylight Saving
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const d0 = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()).getTime();
    if (d1 < d0) return false;
    const diffDays = Math.round((d1 - d0) / (1000 * 60 * 60 * 24));
    return diffDays % this.everyXDays === 0;
  }

  describe(): string {
    if (this.everyXDays === 1) return 'هر روز';
    if (this.everyXDays === 2) return 'یک روز در میان';
    return `هر ${this.everyXDays} روز یک‌بار`;
  }
}
