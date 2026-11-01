import type { Habit } from '@/domain/entities/Habit';
import type { Goal } from '@/domain/entities/Goal';
import type { HabitLog } from '@/domain/entities/HabitLog';
import type { ObstacleLog } from '@/domain/entities/ObstacleLog';

export interface BehavioralTip {
  readonly id: string;
  readonly type: 'encouragement' | 'warning' | 'research_insight' | 'celebration';
  readonly title: string;
  readonly message: string;
  readonly sourceOrTone: string; // e.g. "پژوهش کالج لندن (UCL)" یا "پیشنهاد تجربی"
  readonly actionLabel?: string;
  readonly actionRoute?: string;
}

export class BehavioralTipEvaluator {
  /**
   * ارزیابی هوشمند رفتار کاربر و استخراج مفیدترین نکته رفتاری روز
   */
  static evaluateTips(params: {
    habits: readonly Habit[];
    goals: readonly Goal[];
    todayLogs: readonly HabitLog[];
    recentLogsMap: Map<string, readonly HabitLog[]>;
    obstacles: readonly ObstacleLog[];
    effectiveTodayIso: string;
  }): BehavioralTip[] {
    const tips: BehavioralTip[] = [];
    const activeHabits = params.habits.filter(h => !h.isArchived && !h.isPaused);
    const activeGoals = params.goals.filter(g => g.status === 'active' && !g.isArchived);

    // ۱. بررسی روزهای متوالی فراموشی (۳ روز ثبت‌نشده)
    if (activeHabits.length > 0) {
      let consecutiveMissedDays = 0;
      const today = new Date(params.effectiveTodayIso);

      for (let i = 1; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        let anyCompletedOnDay = false;

        for (const habit of activeHabits) {
          const logs = params.recentLogsMap.get(habit.id) || [];
          if (logs.some(l => l.date === iso && (l.isCompleted || l.isFrozen))) {
            anyCompletedOnDay = true;
            break;
          }
        }
        if (!anyCompletedOnDay) {
          consecutiveMissedDays++;
        }
      }

      if (consecutiveMissedDays >= 3) {
        tips.push({
          id: 'missed-3-days',
          type: 'encouragement',
          title: 'شروع دوباره فقط با یک قدم ۲ دقیقه‌ای',
          message: 'سه روز است هیچ عادتی تیک نخورده است. نیازی به جبران روزهای گذشته نیست؛ طبق پژوهش کالج لندن، چند روز فاصله فرآیند شکل‌گیری عادت در مغز را صفر نمی‌کند. امروز فقط ساده‌ترین قدم ممکن را بردارید.',
          sourceOrTone: 'پژوهش تجربی دکتر لالی (۲۰۰۹)',
          actionLabel: 'مشاهده مقاله استریک نرم',
          actionRoute: '/guide?topic=soft_streaks'
        });
      }
    }

    // ۲. بررسی تعداد زیاد اهداف فعال (بیش از ۳ هدف)
    if (activeGoals.length > 3) {
      tips.push({
        id: 'high-active-goals',
        type: 'warning',
        title: 'پیشنهاد تمرکز: همزمانی بیش از ۳ هدف فعال',
        message: 'در حال حاضر بیش از ۳ هدف فعال دارید. تقسیم انرژی شناختی بین چند جبهه، خطر فرسودگی و تعویق را تشدید می‌کند. توصیه می‌شود ۱ یا ۲ هدف کلیدی را به عنوان اولویت بالا برگزینید.',
        sourceOrTone: 'پیشنهاد مدیریت رفتاری',
        actionLabel: 'مشاهده چارچوب SMART',
        actionRoute: '/guide?topic=smart_goals'
      });
    }

    // ۳. بررسی موانع پرتکرار (مانند خستگی)
    if (params.obstacles.length >= 3) {
      const fatigueCount = params.obstacles.filter(o => o.category === 'fatigue').length;
      if (fatigueCount >= 2) {
        tips.push({
          id: 'obstacle-fatigue-pattern',
          type: 'research_insight',
          title: 'الگوی مانع خستگی شناسایی شد',
          message: 'بیشتر موانع ثبت‌شده شما مربوط به افت انرژی و خستگی بوده است. پیشنهاد می‌شود برای این عادات یک برنامه «اگر-آنگاه» تنظیم کنید یا ساعت اجرای آن‌ها را به صبح منتقل نمایید.',
          sourceOrTone: 'پژوهش دانشگاه نیویورک (گول‌ویتزر)',
          actionLabel: 'طراحی برنامه اگر-آنگاه',
          actionRoute: '/guide?topic=if_then_plans'
        });
      }
    }

    return tips;
  }
}
