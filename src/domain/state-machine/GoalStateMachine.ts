import { GoalStatus } from '../value-objects/GoalStatus';
import type { Goal } from '../entities/Goal';
import { GoalDependencyService } from '../services/GoalDependencyService';

export class InvalidGoalStatusTransitionError extends Error {
  constructor(public readonly from: GoalStatus, public readonly to: GoalStatus) {
    super(`انتقال وضعیت هدف از «${from}» به «${to}» مجاز نیست.`);
    this.name = 'InvalidGoalStatusTransitionError';
  }
}

export class GoalBlockedByPrerequisitesError extends Error {
  constructor(
    public readonly goalTitle: string,
    public readonly uncompletedPrerequisites: readonly string[]
  ) {
    super(
      `هدف «${goalTitle}» نمی‌تواند شروع شود؛ ابتدا باید پیش‌نیازهای زیر تکمیل گردند: ${uncompletedPrerequisites.join('، ')}`
    );
    this.name = 'GoalBlockedByPrerequisitesError';
  }
}

export class ParentGoalCannotCompleteError extends Error {
  constructor(
    public readonly parentTitle: string,
    public readonly uncompletedChildrenTitles: readonly string[]
  ) {
    super(
      `هدف والد «${parentTitle}» نمی‌تواند تکمیل شود زیرا ${uncompletedChildrenTitles.length} هدف زیرمجموعه آن هنوز ناتمام هستند: ${uncompletedChildrenTitles.join('، ')}`
    );
    this.name = 'ParentGoalCannotCompleteError';
  }
}

export class GoalStateMachine {
  private static readonly VALID_TRANSITIONS: Readonly<Record<GoalStatus, readonly GoalStatus[]>> = {
    draft: ['scheduled', 'active'],
    scheduled: ['active', 'draft', 'abandoned'],
    active: ['paused', 'completed', 'abandoned'],
    paused: ['active', 'abandoned'],
    completed: ['active'], // امکان بازگشایی هدف
    abandoned: ['draft'] // امکان بازنگری و بردن به پیش‌نویس
  };

  /**
   * بررسی مجاز بودن انتقال پایه‌ای بین دو وضعیت
   */
  static canTransition(from: GoalStatus, to: GoalStatus): boolean {
    if (from === to) return true;
    const allowed = GoalStateMachine.VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * اعمال انتقال وضعیت با اعتبارسنجی قطعی ساختار هدف
   */
  static transition(from: GoalStatus, to: GoalStatus): GoalStatus {
    if (from === to) return to;
    if (!GoalStateMachine.canTransition(from, to)) {
      throw new InvalidGoalStatusTransitionError(from, to);
    }
    return to;
  }

  /**
   * اعتبارسنجی جامع انتقال وضعیت با احتساب قوانین پیش‌نیازها و روابط والد/فرزند
   */
  static validateContextualTransition(params: {
    goal: Goal;
    targetStatus: GoalStatus;
    allGoals: readonly Goal[];
  }): {
    isAllowed: boolean;
    cascadeStatusForChildren?: GoalStatus;
    affectedChildren?: readonly Goal[];
    error?: string;
  } {
    const { goal, targetStatus, allGoals } = params;

    // ۱. بررسی دیاگرام پایه ماشین وضعیت
    if (!this.canTransition(goal.status, targetStatus)) {
      return {
        isAllowed: false,
        error: `انتقال از «${goal.status}» به «${targetStatus}» طبق قوانین ماشین وضعیت مجاز نیست.`
      };
    }

    // ۲. بررسی پیش‌نیازها هنگام انتقال به active
    if (targetStatus === 'active') {
      const prereqCheck = GoalDependencyService.checkPrerequisites(goal, allGoals);
      if (prereqCheck.isBlocked) {
        const titles = prereqCheck.uncompletedPrerequisites.map(p => p.title);
        return {
          isAllowed: false,
          error: `هدف «${goal.title}» نمی‌تواند فعال شود زیرا پیش‌نیازهای زیر هنوز تکمیل نشده‌اند: ${titles.join('، ')}`
        };
      }
    }

    // ۳. بررسی قانون تکمیل والد (والد زمانی تکمیل می‌شود که فرزندان تکمیل شده باشند)
    const directChildren = allGoals.filter(g => g.parentId === goal.id && !g.isArchived);
    if (targetStatus === 'completed' && directChildren.length > 0) {
      const uncompletedChildren = directChildren.filter(c => c.status !== 'completed');
      if (uncompletedChildren.length > 0) {
        const titles = uncompletedChildren.map(c => c.title);
        return {
          isAllowed: false,
          error: `هدف والد «${goal.title}» نمی‌تواند تکمیل شود زیرا هنوز ${uncompletedChildren.length} هدف زیرمجموعه آن ناتمام هستند: ${titles.join('، ')}`
        };
      }
    }

    // ۴. تعیین وضعیت آبشاری (Cascade) برای فرزندان در صورت رها شدن والد (Abandoned)
    if (targetStatus === 'abandoned' && directChildren.length > 0) {
      const activeOrScheduledChildren = directChildren.filter(
        c => c.status !== 'completed' && c.status !== 'abandoned'
      );
      return {
        isAllowed: true,
        cascadeStatusForChildren: 'abandoned',
        affectedChildren: activeOrScheduledChildren
      };
    }

    // ۵. توقف موقت آبشاری فرزندان هنگام توقف والد (Paused)
    if (targetStatus === 'paused' && directChildren.length > 0) {
      const activeChildren = directChildren.filter(c => c.status === 'active');
      return {
        isAllowed: true,
        cascadeStatusForChildren: 'paused',
        affectedChildren: activeChildren
      };
    }

    // ۶. ازسرگیری فرزندان متوقف‌شده هنگام ازسرگیری والد از Paused به Active
    if (goal.status === 'paused' && targetStatus === 'active' && directChildren.length > 0) {
      const pausedChildren = directChildren.filter(c => c.status === 'paused');
      return {
        isAllowed: true,
        cascadeStatusForChildren: 'active',
        affectedChildren: pausedChildren
      };
    }

    return { isAllowed: true };
  }

  /**
   * دریافت فهرست وضعیت‌های مجاز بعدی
   */
  static getAllowedNextStatuses(current: GoalStatus): readonly GoalStatus[] {
    return GoalStateMachine.VALID_TRANSITIONS[current] || [];
  }
}
