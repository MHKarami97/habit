import { SolarDateMath } from '@/infrastructure/calendar/SolarDateMath';
import { PeriodicReview, type PeriodicReviewType } from '../entities/PeriodicReview';
import type { Habit } from '../entities/Habit';
import type { HabitLog } from '../entities/HabitLog';
import type { Goal } from '../entities/Goal';

export interface PeriodStatsCalculation {
  readonly adherenceRate: number;
  readonly completedHabitsCount: number;
  readonly totalExpectedHabits: number;
  readonly activeGoalsCount: number;
}

export class PeriodicReviewService {
  /**
   * محاسبه خودکار آمارهای پایبندی عادات و اهداف در بازه زمانی بازبینی
   */
  static calculatePeriodStats(params: {
    startDateIso: string;
    endDateIso: string;
    habits: readonly Habit[];
    habitLogs: readonly HabitLog[];
    goals: readonly Goal[];
  }): PeriodStatsCalculation {
    const activeHabits = params.habits.filter(h => !h.isArchived);
    const start = new Date(params.startDateIso);
    const end = new Date(params.endDateIso);

    // محاسبه تعداد روزهای بازه (شامل روز شروع و پایان)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let totalExpectedHabits = 0;
    for (const habit of activeHabits) {
      if (habit.isPaused) continue;

      if (habit.recurrence.type === 'daily') {
        totalExpectedHabits += daysCount;
      } else if (habit.recurrence.type === 'weekly_days') {
        const targetDays = habit.recurrence.daysOfWeek || [];
        totalExpectedHabits += Math.round((targetDays.length / 7) * daysCount);
      } else if (habit.recurrence.type === 'frequency') {
        totalExpectedHabits += Math.round((habit.recurrence.count / (habit.recurrence.period === 'week' ? 7 : 30)) * daysCount);
      } else {
        totalExpectedHabits += Math.max(1, Math.round(daysCount / (habit.recurrence.everyXDays || 2)));
      }
    }

    if (totalExpectedHabits === 0 && activeHabits.length > 0) {
      totalExpectedHabits = activeHabits.length * daysCount;
    }

    // فیلتر لاگ‌های قرارگرفته در بازه
    const relevantLogs = params.habitLogs.filter(log => {
      return log.date >= params.startDateIso && log.date <= params.endDateIso;
    });

    const completedHabitsCount = relevantLogs.filter(log => log.isCompleted || log.isFrozen).length;

    const adherenceRate = totalExpectedHabits > 0
      ? Math.min(100, Math.round((completedHabitsCount / totalExpectedHabits) * 100))
      : 0;

    const activeGoalsCount = params.goals.filter(g => g.status === 'active' && !g.isArchived).length;

    return {
      adherenceRate,
      completedHabitsCount,
      totalExpectedHabits,
      activeGoalsCount
    };
  }

  /**
   * استخراج عنوان و کلید دوره‌ای بازبینی بر اساس تاریخ شمسی
   */
  static getPeriodInfo(type: PeriodicReviewType, dateIso: string): {
    periodKey: string;
    periodLabel: string;
    solarYear: number;
    solarPeriod: number;
    startDateIso: string;
    endDateIso: string;
  } {
    const d = new Date(dateIso);
    const solar = SolarDateMath.gregorianToSolar(d.getFullYear(), d.getMonth() + 1, d.getDate());

    if (type === 'monthly') {
      const monthNames = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
      ];
      const mStr = String(solar.month).padStart(2, '0');
      const periodKey = `${solar.year}-${mStr}`;
      const periodLabel = `${monthNames[solar.month - 1]} ${SolarDateMath.toPersianDigits(solar.year)}`;

      // محاسبه اولین و آخرین روز ماه شمسی به میلادی
      const daysInMonth = SolarDateMath.getDaysInSolarMonth(solar.year, solar.month);
      const startG = SolarDateMath.solarToGregorian(solar.year, solar.month, 1);
      const endG = SolarDateMath.solarToGregorian(solar.year, solar.month, daysInMonth);

      const pad = (n: number) => String(n).padStart(2, '0');
      const startDateIso = `${startG.year}-${pad(startG.month)}-${pad(startG.day)}`;
      const endDateIso = `${endG.year}-${pad(endG.month)}-${pad(endG.day)}`;

      return {
        periodKey,
        periodLabel,
        solarYear: solar.year,
        solarPeriod: solar.month,
        startDateIso,
        endDateIso
      };
    } else {
      // هفتگی: برآورد شماره هفته شمسی (۱ تا ۵۲)
      // روزهای سپری‌شده از ابتدای سال شمسی
      let dayOfYear = 0;
      for (let m = 1; m < solar.month; m++) {
        dayOfYear += SolarDateMath.getDaysInSolarMonth(solar.year, m);
      }
      dayOfYear += solar.day;

      const weekNumber = Math.min(52, Math.max(1, Math.ceil(dayOfYear / 7)));
      const wStr = String(weekNumber).padStart(2, '0');
      const periodKey = `${solar.year}-W${wStr}`;
      const periodLabel = `هفته ${SolarDateMath.toPersianDigits(weekNumber)} سال ${SolarDateMath.toPersianDigits(solar.year)}`;

      // محاسبه شنبه تا جمعه این هفته
      // در تقویم میلادی: شنبه = روز 6 (Saturday)
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      const diffToSaturday = (dayOfWeek + 1) % 7; // فاصله تا شنبه گذشته
      const saturday = new Date(d);
      saturday.setDate(saturday.getDate() - diffToSaturday);

      const friday = new Date(saturday);
      friday.setDate(friday.getDate() + 6);

      const pad = (n: number) => String(n).padStart(2, '0');
      const startDateIso = `${saturday.getFullYear()}-${pad(saturday.getMonth() + 1)}-${pad(saturday.getDate())}`;
      const endDateIso = `${friday.getFullYear()}-${pad(friday.getMonth() + 1)}-${pad(friday.getDate())}`;

      return {
        periodKey,
        periodLabel,
        solarYear: solar.year,
        solarPeriod: weekNumber,
        startDateIso,
        endDateIso
      };
    }
  }

  /**
   * ساخت یک نمونه بازبینی جدید با اعتبارسنجی
   */
  static createReview(props: {
    id: string;
    type: PeriodicReviewType;
    periodKey: string;
    solarYear: number;
    solarPeriod: number;
    periodLabel: string;
    startDateIso: string;
    endDateIso: string;
    whatWorked: string;
    whatDidntWork: string;
    primaryObstacle: string;
    actionPlan: string;
    adherenceRate: number;
    completedHabitsCount: number;
    totalExpectedHabits: number;
    activeGoalsCount: number;
  }): PeriodicReview {
    const nowIso = new Date().toISOString();
    return new PeriodicReview({
      ...props,
      createdAt: nowIso,
      updatedAt: nowIso
    });
  }
}
