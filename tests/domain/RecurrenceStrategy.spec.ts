import { describe, it, expect } from 'vitest';
import { DailyRecurrenceStrategy } from '@/domain/strategies/DailyRecurrenceStrategy';
import { WeeklyDaysRecurrenceStrategy } from '@/domain/strategies/WeeklyDaysRecurrenceStrategy';
import { IntervalDaysRecurrenceStrategy } from '@/domain/strategies/IntervalDaysRecurrenceStrategy';

describe('Recurrence Strategies', () => {
  it('DailyRecurrenceStrategy is due on every day', () => {
    const strategy = new DailyRecurrenceStrategy();
    expect(strategy.isDueOn()).toBe(true);
  });

  it('WeeklyDaysRecurrenceStrategy accurately checks Persian weekdays', () => {
    // 0 = شنبه, 4 = چهارشنبه
    const strategy = new WeeklyDaysRecurrenceStrategy([0, 4]);

    // 2026-10-31 is a Saturday (شنبه): JS getDay() = 6 -> (6+1)%7 = 0
    const saturday = new Date(2026, 9, 31);
    expect(strategy.isDueOn(saturday)).toBe(true);

    // 2026-11-01 is a Sunday (یکشنبه): JS getDay() = 0 -> (0+1)%7 = 1
    const sunday = new Date(2026, 10, 1);
    expect(strategy.isDueOn(sunday)).toBe(false);

    // 2026-11-04 is a Wednesday (چهارشنبه): JS getDay() = 3 -> (3+1)%7 = 4
    const wednesday = new Date(2026, 10, 4);
    expect(strategy.isDueOn(wednesday)).toBe(true);
  });

  it('IntervalDaysRecurrenceStrategy checks every X days from anchor', () => {
    const anchor = '2026-11-01';
    const strategy = new IntervalDaysRecurrenceStrategy(2, anchor);

    const day0 = new Date(2026, 10, 1);
    const day1 = new Date(2026, 10, 2);
    const day2 = new Date(2026, 10, 3);

    expect(strategy.isDueOn(day0)).toBe(true);
    expect(strategy.isDueOn(day1)).toBe(false);
    expect(strategy.isDueOn(day2)).toBe(true);
  });
});
