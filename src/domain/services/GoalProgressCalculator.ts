import { Goal } from '../entities/Goal';
import { Milestone } from '../entities/Milestone';

export class GoalProgressCalculator {
  /**
   * محاسبه درصد جامع پیشرفت هدف:
   * اگر مایلستون دارد، میانگین وزن‌دار مایلستون‌ها و سنجه در نظر گرفته می‌شود
   * اگر فقط سنجه دارد، مستقیماً درصد سنجه بازگردانده می‌شود.
   */
  static calculate(goal: Goal, milestones: readonly Milestone[]): number {
    if (goal.status === 'completed') return 100;
    if (goal.status === 'draft') return 0;

    const metricProgress = goal.metric.progressPercentage;

    if (milestones.length === 0) {
      return metricProgress;
    }

    const completedMilestones = milestones.filter(m => m.isCompleted).length;
    const milestoneProgress = Math.round((completedMilestones / milestones.length) * 100);

    // اگر سنجه عددی تغییر کرده باشد، ترکیب ۵۰٪ مایلستون‌ها و ۵۰٪ سنجه
    const isMetricTouched = goal.metric.currentValue !== goal.metric.startValue;
    if (isMetricTouched) {
      return Math.round((milestoneProgress + metricProgress) / 2);
    }

    return milestoneProgress;
  }
}
