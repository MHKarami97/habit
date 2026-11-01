import { IRecurrenceStrategy } from './IRecurrenceStrategy';

export class FrequencyPeriodStrategy implements IRecurrenceStrategy {
  constructor(
    public readonly count: number,
    public readonly period: 'week' | 'month'
  ) {}

  isDueOn(): boolean {
    // در اهداف شناور فرکانسی، تمام روزهای بازه تا سقف مورد نظر مجاز و باز هستند
    return true;
  }

  describe(): string {
    const periodLabel = this.period === 'week' ? 'هفته' : 'ماه';
    return `${this.count} بار در هر ${periodLabel}`;
  }
}
