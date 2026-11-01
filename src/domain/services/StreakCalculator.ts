import { Habit } from '../entities/Habit';
import { HabitLog } from '../entities/HabitLog';
import { RecurrenceStrategyFactory } from '../strategies/RecurrenceStrategyFactory';
import { PERSIAN_WEEK_DAYS } from '../strategies/WeeklyDaysRecurrenceStrategy';

export interface MilestoneInfo {
  readonly targetDays: 7 | 21 | 66;
  readonly title: string;
  readonly isReached: boolean;
  readonly progressPercentage: number;
}

export interface WeakestDayInfo {
  readonly dayIndex: number; // 0 = شنبه, ..., 6 = جمعه
  readonly dayName: string;
  readonly totalDue: number;
  readonly totalCompleted: number;
  readonly rate: number; // 0 to 100
}

export interface StreakAnalysisResult {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly adherenceRate: number; // 0 to 100
  readonly totalCompletedDays: number;
  readonly totalDueDays: number;
  readonly milestones: readonly MilestoneInfo[];
  readonly weakestDay: WeakestDayInfo | null;
}

export class StreakCalculator {
  /**
   * محاسبه استریک نرم، بیشترین استریک و پایبندی با در نظر گرفتن روزهای فریز و روزهای موعد
   */
  static calculate(
    habit: Habit,
    logs: readonly HabitLog[],
    todayIso: string
  ): StreakAnalysisResult {
    const strategy = RecurrenceStrategyFactory.create(habit.recurrence);
    const logsMap = new Map<string, HabitLog>();
    logs.forEach(l => logsMap.set(l.date, l));

    const parseYmd = (iso: string) => {
      const parts = iso.slice(0, 10).split('-').map(Number);
      return new Date(parts[0] ?? 2026, (parts[1] ?? 1) - 1, parts[2] ?? 1);
    };
    const formatYmd = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    // محاسبه بازه تاریخی از تاریخ شروع تا امروز
    const startDate = parseYmd(habit.startDate);
    const today = parseYmd(todayIso);

    // اگر تاریخ شروع در آینده باشد
    if (startDate.getTime() > today.getTime()) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        adherenceRate: 100,
        totalCompletedDays: 0,
        totalDueDays: 0,
        milestones: StreakCalculator.getMilestones(0),
        weakestDay: null
      };
    }

    // آمار روزهای هفته (۰ تا ۶)
    const weekdayDue = [0, 0, 0, 0, 0, 0, 0];
    const weekdayDone = [0, 0, 0, 0, 0, 0, 0];

    // استخراج تمام تاریخ‌های موعد به صورت صعودی
    const datesAscending: { dateStr: string; dateObj: Date; isCompleted: boolean; isFrozen: boolean }[] = [];
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    while (cur <= end) {
      const dateStr = formatYmd(cur);
      const isDue = strategy.isDueOn(cur);
      const persianDayIndex = (cur.getDay() + 1) % 7;

      if (isDue) {
        weekdayDue[persianDayIndex] = (weekdayDue[persianDayIndex] ?? 0) + 1;
        const log = logsMap.get(dateStr);
        const isCompleted = Boolean(log?.isCompleted);
        const isFrozen = Boolean(log?.isFrozen);

        if (isCompleted || isFrozen) {
          weekdayDone[persianDayIndex] = (weekdayDone[persianDayIndex] ?? 0) + 1;
        }

        datesAscending.push({
          dateStr,
          dateObj: new Date(cur),
          isCompleted,
          isFrozen
        });
      }

      cur.setDate(cur.getDate() + 1);
    }

    const totalDueDays = datesAscending.length;
    const totalCompletedDays = datesAscending.filter(d => d.isCompleted).length;
    const adherenceRate = totalDueDays > 0 ? Math.round((totalCompletedDays / totalDueDays) * 100) : 100;

    // محاسبه استریک جاری از آخر (امروز یا دیروز) به عقب
    let currentStreak = 0;
    const reversed = [...datesAscending].reverse();

    // اگر امروز هنوز تیک نخورده باشد، استریک از دیروز قطع نمی‌شود
    let startIndex = 0;
    if (reversed.length > 0 && reversed[0]?.dateStr === todayIso && !reversed[0].isCompleted && !reversed[0].isFrozen) {
      startIndex = 1;
    }

    for (let i = startIndex; i < reversed.length; i++) {
      const entry = reversed[i];
      if (!entry) break;
      if (entry.isCompleted || entry.isFrozen) {
        currentStreak++;
      } else {
        break; // شکسته شدن استریک
      }
    }

    // محاسبه طولانی‌ترین استریک در کل تاریخچه
    let longestStreak = 0;
    let tempStreak = 0;
    for (const entry of datesAscending) {
      if (entry.isCompleted || entry.isFrozen) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // ضعیف‌ترین روز هفته
    let weakestDay: WeakestDayInfo | null = null;
    let minRate = 101;
    for (let i = 0; i < 7; i++) {
      const due = weekdayDue[i] ?? 0;
      const done = weekdayDone[i] ?? 0;
      if (due >= 2) {
        // حداقل ۲ بار تکرار شده باشد تا تصادفی نباشد
        const rate = Math.round((done / due) * 100);
        if (rate < minRate) {
          minRate = rate;
          weakestDay = {
            dayIndex: i,
            dayName: PERSIAN_WEEK_DAYS[i] ?? '',
            totalDue: due,
            totalCompleted: done,
            rate
          };
        }
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      adherenceRate,
      totalCompletedDays,
      totalDueDays,
      milestones: StreakCalculator.getMilestones(currentStreak),
      weakestDay
    };
  }

  private static getMilestones(streak: number): readonly MilestoneInfo[] {
    return [
      {
        targetDays: 7,
        title: 'شروع اولیه (۷ روز)',
        isReached: streak >= 7,
        progressPercentage: Math.min(100, Math.round((streak / 7) * 100))
      },
      {
        targetDays: 21,
        title: 'میان‌راه (۲۱ روز)', // طبق دستور صریح: ۲۱ میان‌راه است، نه نقطه تثبیت
        isReached: streak >= 21,
        progressPercentage: Math.min(100, Math.round((streak / 21) * 100))
      },
      {
        targetDays: 66,
        title: 'تثبیت رفتار (۶۶ روز)',
        isReached: streak >= 66,
        progressPercentage: Math.min(100, Math.round((streak / 66) * 100))
      }
    ];
  }
}
