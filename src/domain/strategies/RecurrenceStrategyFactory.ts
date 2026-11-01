import { RecurrenceConfig } from '../value-objects/RecurrenceConfig';
import { IRecurrenceStrategy } from './IRecurrenceStrategy';
import { DailyRecurrenceStrategy } from './DailyRecurrenceStrategy';
import { WeeklyDaysRecurrenceStrategy } from './WeeklyDaysRecurrenceStrategy';
import { FrequencyPeriodStrategy } from './FrequencyPeriodStrategy';
import { IntervalDaysRecurrenceStrategy } from './IntervalDaysRecurrenceStrategy';

export class RecurrenceStrategyFactory {
  static create(config: RecurrenceConfig): IRecurrenceStrategy {
    switch (config.type) {
      case 'daily':
        return new DailyRecurrenceStrategy();
      case 'weekly_days':
        return new WeeklyDaysRecurrenceStrategy(config.daysOfWeek);
      case 'frequency':
        return new FrequencyPeriodStrategy(config.count, config.period);
      case 'interval':
        return new IntervalDaysRecurrenceStrategy(config.everyXDays, config.anchorDate);
    }
  }
}
