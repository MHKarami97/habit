import { GoalStatus } from '../value-objects/GoalStatus';

export class InvalidGoalStatusTransitionError extends Error {
  constructor(public readonly from: GoalStatus, public readonly to: GoalStatus) {
    super(`انتقال وضعیت هدف از «${from}» به «${to}» مجاز نیست.`);
    this.name = 'InvalidGoalStatusTransitionError';
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
   * بررسی مجاز بودن انتقال بین دو وضعیت
   */
  static canTransition(from: GoalStatus, to: GoalStatus): boolean {
    if (from === to) return true;
    const allowed = GoalStateMachine.VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * اعمال انتقال وضعیت با اعتبارسنجی قطعی
   */
  static transition(from: GoalStatus, to: GoalStatus): GoalStatus {
    if (from === to) return to;
    if (!GoalStateMachine.canTransition(from, to)) {
      throw new InvalidGoalStatusTransitionError(from, to);
    }
    return to;
  }

  /**
   * دریافت فهرست وضعیت‌های مجاز بعدی
   */
  static getAllowedNextStatuses(current: GoalStatus): readonly GoalStatus[] {
    return GoalStateMachine.VALID_TRANSITIONS[current] || [];
  }
}
