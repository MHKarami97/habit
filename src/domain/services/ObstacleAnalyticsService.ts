import type { ObstacleLog, ObstacleCategory } from '../entities/ObstacleLog';
import { getObstacleCategoryLabel } from '../entities/ObstacleLog';
import { SolarDateMath } from '@/infrastructure/calendar/SolarDateMath';
import type { Habit } from '../entities/Habit';
import type { HabitLog } from '../entities/HabitLog';

export interface ObstacleDistribution {
  readonly category: ObstacleCategory;
  readonly label: string;
  readonly count: number;
  readonly percentage: number; // 0 to 100
}

export interface StreakDropCorrelation {
  readonly category: ObstacleCategory;
  readonly label: string;
  readonly breakCount: number;
  readonly breakPercentage: number; // percentage of total correlated breaks
  readonly dropImpactLevel: 'high' | 'medium' | 'low';
}

export type ActionableRecommendationType =
  | 'move_to_morning'
  | 'tiny_habit_downscale'
  | 'create_if_then_plan'
  | 'pause_low_priority_goals';

export interface ActionableRecommendation {
  readonly id: string;
  readonly type: ActionableRecommendationType;
  readonly title: string;
  readonly insight: string;
  readonly suggestion: string;
  readonly scientificNote: string;
  readonly actionLabel: string;
  readonly actionPayload: {
    readonly habitId?: string;
    readonly suggestedReminderTime?: string;
    readonly goalId?: string;
    readonly category?: ObstacleCategory;
  };
}

export class ObstacleAnalyticsService {
  /**
   * محاسبه توزیع فراوانی موانع ثبت‌شده
   */
  static calculateDistribution(obstacles: readonly ObstacleLog[]): ObstacleDistribution[] {
    if (obstacles.length === 0) return [];

    const counts = new Map<ObstacleCategory, number>();
    for (const obs of obstacles) {
      counts.set(obs.category, (counts.get(obs.category) || 0) + 1);
    }

    const total = obstacles.length;
    const result: ObstacleDistribution[] = [];

    counts.forEach((count, category) => {
      result.push({
        category,
        label: getObstacleCategoryLabel(category),
        count,
        percentage: Math.round((count / total) * 100)
      });
    });

    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * تحلیل همبستگی نوع مانع با افت یا شکست استریک عادات
   * بررسی می‌کند چه موانعی در روزهای افت استریک ثبت شده‌اند
   */
  static calculateStreakDropCorrelations(params: {
    obstacles: readonly ObstacleLog[];
    habits: readonly Habit[];
    habitLogsMap: Map<string, readonly HabitLog[]>;
  }): StreakDropCorrelation[] {
    if (params.obstacles.length === 0 || params.habits.length === 0) {
      return [];
    }

    // شناسایی تاریخ‌های شکست استریک (روزهایی که لاگ موفق نداشتند بعد از حداقل ۲ روز موفق)
    const breakDatesSet = new Set<string>();

    params.habitLogsMap.forEach(logs => {
      // مرتب‌سازی بر اساس تاریخ صعودی
      const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
      let currentStreakRun = 0;

      for (const log of sortedLogs) {
        if (log.isCompleted || log.isFrozen) {
          currentStreakRun++;
        } else {
          if (currentStreakRun >= 2) {
            breakDatesSet.add(log.date);
          }
          currentStreakRun = 0;
        }
      }
    });

    // شمارش موانعی که تاریخ آن‌ها دقیقاً در روز شکست یا ۱ روز قبل از آن رخ داده است
    const categoryBreakCounts = new Map<ObstacleCategory, number>();
    let totalCorrelatedBreaks = 0;

    for (const obs of params.obstacles) {
      const obsDate = new Date(obs.date);
      const nextDay = new Date(obsDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayIso = nextDay.toISOString().slice(0, 10);

      if (breakDatesSet.has(obs.date) || breakDatesSet.has(nextDayIso)) {
        categoryBreakCounts.set(obs.category, (categoryBreakCounts.get(obs.category) || 0) + 1);
        totalCorrelatedBreaks++;
      }
    }

    if (totalCorrelatedBreaks === 0) {
      // اگر همبستگی مستقیم با تاریخ پیدا نشد، از توزیع کلی موانع برای برآورد اولیه استفاده می‌کنیم
      return this.calculateDistribution(params.obstacles).map(d => ({
        category: d.category,
        label: d.label,
        breakCount: d.count,
        breakPercentage: d.percentage,
        dropImpactLevel: d.percentage > 40 ? 'high' : d.percentage > 20 ? 'medium' : 'low'
      }));
    }

    const correlations: StreakDropCorrelation[] = [];
    categoryBreakCounts.forEach((count, category) => {
      const breakPercentage = Math.round((count / totalCorrelatedBreaks) * 100);
      correlations.push({
        category,
        label: getObstacleCategoryLabel(category),
        breakCount: count,
        breakPercentage,
        dropImpactLevel: breakPercentage >= 40 ? 'high' : breakPercentage >= 20 ? 'medium' : 'low'
      });
    });

    return correlations.sort((a, b) => b.breakCount - a.breakCount);
  }

  /**
   * تولید پیشنهادهای داده‌محور غیرتهاجمی همراه با دکمه اقدام صریح (Actionable Recommendations)
   */
  static generateActionableRecommendations(params: {
    obstacles: readonly ObstacleLog[];
    correlations: readonly StreakDropCorrelation[];
    activeGoalsCount: number;
    habits: readonly Habit[];
  }): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];

    // ۱. بررسی مانع خستگی (Fatigue)
    const fatigueCorrelation = params.correlations.find(c => c.category === 'fatigue');
    if (fatigueCorrelation && fatigueCorrelation.breakCount >= 1) {
      const eveningHabit = params.habits.find(h => {
        return h.reminderTimes.some(t => {
          const hour = parseInt(t.slice(0, 2), 10);
          return hour >= 18;
        });
      });

      recommendations.push({
        id: 'rec-fatigue-morning',
        type: 'move_to_morning',
        title: 'افت استریک بر اثر خستگی عصرگاهی',
        insight: `وقتی مانع «خستگی» رخ می‌دهد، استریک با بیشترین افت مواجه می‌شود (${fatigueCorrelation.breakPercentage}٪ افت‌ها).`,
        suggestion: 'پیشنهاد: ساعت اجرای عادت یا یادآور را به ساعات آغازین روز (پیش از مصرف انرژی شناختی) انتقال دهید.',
        scientificNote: 'بر پایه نظریه کاهش ذخیره اراده (Ego Depletion - Baumeister) و مدل رفتاری Fogg',
        actionLabel: 'انتقال یادآور به صبح (۰۷:۳۰)',
        actionPayload: {
          habitId: eveningHabit?.id,
          suggestedReminderTime: '07:30',
          category: 'fatigue'
        }
      });
    }

    // ۲. بررسی مانع کمبود زمان و فشار کاری (Work Pressure / Lack of Time)
    const workPressure = params.correlations.find(c => c.category === 'work_pressure');
    if (workPressure && workPressure.breakCount >= 1) {
      recommendations.push({
        id: 'rec-downscale-target',
        type: 'tiny_habit_downscale',
        title: 'شروع بسیار کوچک در روزهای فشرده',
        insight: 'کمبود زمان و مشغله کاری یکی از عوامل اصلی رها شدن توالی استریک شما بوده است.',
        suggestion: 'پیشنهاد: هدف روزانه را در روزهای شلوغ به یک نسخه اضطراری ۲ دقیقه‌ای کاهش دهید تا زنجیره نشکند.',
        scientificNote: 'اصل گام‌های مقیاس‌ناپذیر در Tiny Habits (دکتر بی.جی فاگ، ۲۰۰۹)',
        actionLabel: 'کوچک‌سازی هدف روزانه',
        actionPayload: {
          category: 'work_pressure'
        }
      });
    }

    // ۳. بررسی حواس‌پرتی یا شبکه‌های اجتماعی (Screen Time / Distraction)
    const screenTime = params.correlations.find(c => c.category === 'screen_time');
    if (screenTime && screenTime.breakCount >= 1) {
      recommendations.push({
        id: 'rec-if-then-screentime',
        type: 'create_if_then_plan',
        title: 'مهار حواس‌پرتی با برنامه اگر-آنگاه',
        insight: 'حواس‌پرتی در زمان اجرای رفتار باعث فراموشی یا تعویق عادت شده است.',
        suggestion: 'پیشنهاد: یک برنامه اگر-آنگاه مشخص بنویسید: «اگر خواستم گوشی را باز کنم، ابتدا ۱ تیک عادت را می‌زنم».',
        scientificNote: 'پژوهش برنامه‌ریزی اجرایی (Implementation Intentions - پروفسور گول‌ویتزر، ۱۹۹۹)',
        actionLabel: 'تنظیم برنامه اگر-آنگاه',
        actionPayload: {
          category: 'screen_time'
        }
      });
    }

    // ۴. بررسی خطر فرسودگی همزمانی بیش از ۳ هدف فعال
    if (params.activeGoalsCount > 3) {
      recommendations.push({
        id: 'rec-focus-goals',
        type: 'pause_low_priority_goals',
        title: 'خطر پراکندگی تمرکز: بیش از ۳ هدف همزمان فعال است',
        insight: `شما ${SolarDateMath.toPersianDigits(params.activeGoalsCount)} هدف فعال همزمان دارید. تقسیم انرژی روی چند هدف بزرگ، خطر فرسودگی شناختی را افزایش می‌دهد.`,
        suggestion: 'پیشنهاد: اهداف کم‌اولویت‌تر را موقتاً در وضعیت «توقف موقت (Paused)» قرار دهید تا تمرکز روی اهداف اصلی بازگردد.',
        scientificNote: 'قانون تمرکز منابع شناختی در روان‌شناسی دستیابی به هدف (Locke & Latham)',
        actionLabel: 'مدیریت و متوقف‌سازی اهداف مازاد',
        actionPayload: {}
      });
    }

    return recommendations;
  }
}
