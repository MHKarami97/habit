import { GoalPriority } from '../value-objects/GoalPriority';
import { GoalStatus } from '../value-objects/GoalStatus';
import { MetricTarget } from '../value-objects/MetricTarget';

export interface GoalProps {
  readonly id: string;
  readonly title: string;
  readonly whyStatement: string;
  readonly categoryId: string;
  readonly priority: GoalPriority;
  readonly status: GoalStatus;
  readonly targetStartDate: string; // ISO date YYYY-MM-DD
  readonly actualStartDate?: string; // ISO date YYYY-MM-DD
  readonly deadline: string; // ISO date YYYY-MM-DD
  readonly actualEndDate?: string; // ISO date YYYY-MM-DD
  readonly metric: MetricTarget;
  readonly isArchived: boolean;
  readonly createdAt: string; // ISO timestamp
  readonly updatedAt: string; // ISO timestamp
}

export class Goal {
  readonly id: string;
  readonly title: string;
  readonly whyStatement: string;
  readonly categoryId: string;
  readonly priority: GoalPriority;
  readonly status: GoalStatus;
  readonly targetStartDate: string;
  readonly actualStartDate?: string;
  readonly deadline: string;
  readonly actualEndDate?: string;
  readonly metric: MetricTarget;
  readonly isArchived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: GoalProps) {
    if (!props.id) throw new Error('شناسه هدف الزامی است');
    if (!props.title.trim()) throw new Error('عنوان هدف الزامی است');
    if (!props.whyStatement.trim()) throw new Error('دلیل و چرایی هدف (Why) الزامی است');
    if (!props.deadline) throw new Error('تعیین مهلت پایان هدف الزامی است');

    this.id = props.id;
    this.title = props.title.trim();
    this.whyStatement = props.whyStatement.trim();
    this.categoryId = props.categoryId || 'general';
    this.priority = props.priority;
    this.status = props.status;
    this.targetStartDate = props.targetStartDate;
    this.actualStartDate = props.actualStartDate;
    this.deadline = props.deadline;
    this.actualEndDate = props.actualEndDate;
    this.metric = props.metric;
    this.isArchived = props.isArchived;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * محاسبه مدت زمان واقعی یا جاری هدف به روز (هرگز در دیتابیس ذخیره نمی‌شود)
   */
  get durationInDays(): number {
    const startStr = this.actualStartDate || this.targetStartDate;
    const endStr = this.actualEndDate || new Date().toISOString().slice(0, 10);
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 0;
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  }

  /**
   * آیا از مهلت هدف گذشته است؟
   */
  isOverdue(currentDateIso: string): boolean {
    if (this.status === 'completed' || this.status === 'abandoned') {
      return false;
    }
    return currentDateIso > this.deadline;
  }

  /**
   * آیا هدف بیش از X روز بدون هیچ اقدامی راکد مانده است؟
   */
  isStale(lastActionDateIso: string | undefined, currentDateIso: string, thresholdDays = 14): boolean {
    if (this.status !== 'active') return false;
    const baseDate = lastActionDateIso || this.actualStartDate || this.createdAt.slice(0, 10);
    const baseTime = new Date(baseDate).getTime();
    const currentTime = new Date(currentDateIso).getTime();
    if (isNaN(baseTime) || isNaN(currentTime)) return false;
    const diffDays = Math.floor((currentTime - baseTime) / (1000 * 60 * 60 * 24));
    return diffDays >= thresholdDays;
  }

  withStatus(newStatus: GoalStatus, updatedAtIso: string): Goal {
    const isNowCompleted = newStatus === 'completed';
    const isNowActive = newStatus === 'active';
    return new Goal({
      ...this,
      status: newStatus,
      actualStartDate: isNowActive && !this.actualStartDate ? updatedAtIso.slice(0, 10) : this.actualStartDate,
      actualEndDate: isNowCompleted ? updatedAtIso.slice(0, 10) : undefined,
      updatedAt: updatedAtIso
    });
  }

  withArchived(isArchived: boolean, updatedAtIso: string): Goal {
    return new Goal({
      ...this,
      isArchived,
      updatedAt: updatedAtIso
    });
  }

  withMetricValue(newValue: number, updatedAtIso: string): Goal {
    return new Goal({
      ...this,
      metric: this.metric.withCurrentValue(newValue),
      updatedAt: updatedAtIso
    });
  }
}
