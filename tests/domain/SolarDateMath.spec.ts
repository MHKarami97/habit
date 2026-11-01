import { describe, it, expect } from 'vitest';
import { SolarDateMath } from '@/infrastructure/calendar/SolarDateMath';

describe('SolarDateMath', () => {
  it('converts known Gregorian dates to Solar dates accurately', () => {
    // 2026-03-21 -> 1405/01/01 (Nowruz)
    const solarNowruz = SolarDateMath.gregorianToSolar(2026, 3, 21);
    expect(solarNowruz.year).toBe(1405);
    expect(solarNowruz.month).toBe(1);
    expect(solarNowruz.day).toBe(1);

    // 2026-11-01 -> 1405/08/10
    const solarNov = SolarDateMath.gregorianToSolar(2026, 11, 1);
    expect(solarNov.year).toBe(1405);
    expect(solarNov.month).toBe(8);
    expect(solarNov.day).toBe(10);
  });

  it('converts Solar date back to Gregorian (round-trip)', () => {
    const greg = SolarDateMath.solarToGregorian(1405, 1, 1);
    expect(greg.year).toBe(2026);
    expect(greg.month).toBe(3);
    expect(greg.day).toBe(21);
  });

  it('correctly shifts date based on endOfDayHour offset', () => {
    // ساعت ۳ بامداد اول نوامبر با endOfDayHour=4 باید به عنوان ۳۱ اکتبر در نظر گرفته شود
    const dateAt3Am = new Date(2026, 10, 1, 3, 0, 0); // Nov 1, 3:00 AM
    const solarShifted = SolarDateMath.dateToSolar(dateAt3Am, 4);

    // ۳۱ اکتبر = ۹ آبان ۱۴۰۵
    expect(solarShifted.month).toBe(8);
    expect(solarShifted.day).toBe(9);
  });

  it('converts digits between Persian and Latin cleanly', () => {
    expect(SolarDateMath.toPersianDigits('1405/08/10')).toBe('۱۴۰۵/۰۸/۱۰');
    expect(SolarDateMath.toLatinDigits('۱۴۰۵/۰۸/۱۰')).toBe('1405/08/10');
  });
});
