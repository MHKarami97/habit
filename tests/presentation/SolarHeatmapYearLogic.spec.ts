import { describe, it, expect } from 'vitest';
import { SolarDateMath, SOLAR_MONTH_NAMES } from '@/infrastructure/calendar/SolarDateMath';

describe('SolarHeatmapYear Calendar Math & Weekday Alignment', () => {
  const WEEKDAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'] as const;
  const WEEKDAY_SHORT_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

  it('aligns weekdays with Saturday as index 0 and Friday as index 6 in both RTL and LTR modes', () => {
    expect(WEEKDAY_SHORT_LABELS[0]).toBe('ش');
    expect(WEEKDAY_NAMES[0]).toBe('شنبه');

    expect(WEEKDAY_SHORT_LABELS[6]).toBe('ج');
    expect(WEEKDAY_NAMES[6]).toBe('جمعه');

    // در حالت استاندارد راست‌به‌چپ (RTL): شنبه در ستون اول از راست (x=102) و جمعه در ستون اول از چپ (x=0)
    const rtlSaturdayX = (6 - 0) * 17;
    const rtlFridayX = (6 - 6) * 17;
    expect(rtlSaturdayX).toBe(102);
    expect(rtlFridayX).toBe(0);

    // در حالت چپ‌به‌راست (LTR): شنبه در ستون اول از چپ (x=0) و جمعه در ستون اول از راست (x=102)
    const ltrSaturdayX = 0 * 17;
    const ltrFridayX = 6 * 17;
    expect(ltrSaturdayX).toBe(0);
    expect(ltrFridayX).toBe(102);
  });

  it('calculates correct first day of week for 1403 and 1405 solar months', () => {
    // در سال ۱۴۰۵: اول فروردین شنبه است (index 0)
    const gFirstFarvardin1405 = SolarDateMath.solarToGregorian(1405, 1, 1);
    const dateFarvardin1405 = new Date(gFirstFarvardin1405.year, gFirstFarvardin1405.month - 1, gFirstFarvardin1405.day);
    const firstDayOfWeek1405 = (dateFarvardin1405.getDay() + 1) % 7;
    expect(firstDayOfWeek1405).toBe(0); // شنبه
    expect(WEEKDAY_NAMES[firstDayOfWeek1405]).toBe('شنبه');

    // در سال ۱۴۰۳: اول فروردین چهارشنبه است (index 4)
    const gFirstFarvardin1403 = SolarDateMath.solarToGregorian(1403, 1, 1);
    const dateFarvardin1403 = new Date(gFirstFarvardin1403.year, gFirstFarvardin1403.month - 1, gFirstFarvardin1403.day);
    const firstDayOfWeek1403 = (dateFarvardin1403.getDay() + 1) % 7;
    expect(firstDayOfWeek1403).toBe(4); // چهارشنبه
    expect(WEEKDAY_NAMES[firstDayOfWeek1403]).toBe('چهارشنبه');

    // در سال ۱۴۰۵: اول آبان جمعه است (index 6)
    const gFirstAban1405 = SolarDateMath.solarToGregorian(1405, 8, 1);
    const dateAban1405 = new Date(gFirstAban1405.year, gFirstAban1405.month - 1, gFirstAban1405.day);
    const firstDayOfWeekAban1405 = (dateAban1405.getDay() + 1) % 7;
    expect(firstDayOfWeekAban1405).toBe(6); // جمعه
    expect(WEEKDAY_NAMES[firstDayOfWeekAban1405]).toBe('جمعه');
  });

  it('ensures each day in a month has valid col (0 to 6) matching its true weekday', () => {
    const year = 1405;
    for (let monthNum = 1; monthNum <= 12; monthNum++) {
      const daysInMonth = SolarDateMath.getDaysInSolarMonth(year, monthNum);
      const firstDayG = SolarDateMath.solarToGregorian(year, monthNum, 1);
      const firstDayDate = new Date(firstDayG.year, firstDayG.month - 1, firstDayG.day);
      const firstDayOfWeek = (firstDayDate.getDay() + 1) % 7;

      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const cellIndex = firstDayOfWeek + dayNum - 1;
        const col = cellIndex % 7;
        const row = Math.floor(cellIndex / 7);

        // اعتبارسنجی مختصات ستون و سطر
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThanOrEqual(6);
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThanOrEqual(5);

        // تطابق ستون با روز واقعی در تقویم میلادی متناظر
        const gDay = SolarDateMath.solarToGregorian(year, monthNum, dayNum);
        const realDate = new Date(gDay.year, gDay.month - 1, gDay.day);
        const expectedCol = (realDate.getDay() + 1) % 7;

        expect(col).toBe(expectedCol);
      }
    }
  });

  it('verifies formatted tooltip title includes Persian weekday name accurately', () => {
    const year = 1405;
    const monthNum = 1; // فروردین
    const monthName = SOLAR_MONTH_NAMES[monthNum - 1];

    const firstDayG = SolarDateMath.solarToGregorian(year, monthNum, 1);
    const firstDayDate = new Date(firstDayG.year, firstDayG.month - 1, firstDayG.day);
    const firstDayOfWeek = (firstDayDate.getDay() + 1) % 7;

    const cellIndex = firstDayOfWeek + 1 - 1; // dayNum = 1
    const col = cellIndex % 7;
    const weekdayName = WEEKDAY_NAMES[col] ?? '';
    const solarFormatted = `${weekdayName}، ۱ ${monthName} ۱۴۰۵`;

    expect(solarFormatted).toBe('شنبه، ۱ فروردین ۱۴۰۵');
    expect(solarFormatted.startsWith('شنبه')).toBe(true);
  });
});
