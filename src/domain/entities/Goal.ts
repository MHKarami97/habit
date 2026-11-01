import { GoalPriority } from '../value-objects/GoalPriority';
import { GoalStatus } from '../value-objects/GoalStatus';
import { MetricTarget } from '../value-objects/MetricTarget';

export type GoalHierarchyLevel = 1 | 2 | 3; // ۱: سالانه، ۲: فصلی، ۳: ماهانه

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
  readonly parentId?: string; // شناسه هدف والد (اختیاری)
  readonly hierarchyLevel?: GoalHierarchyLevel; // پیش‌فرض: ۱ (سطح ریشه)
  readonly weight?: number; // وزن در محاسبه پیشرفت والد (پیش‌فرض: ۱)
  readonly blockedByGoalIds?: readonly string[]; // شناسه‌های اهداف پیش‌نیاز
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
  readonly parentId?: string;
  readonly hierarchyLevel: GoalHierarchyLevel;
  readonly weight: number;
  readonly blockedByGoalIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: GoalProps) {
    if (!props.id) throw new Error('شناسه هدف الزامی است');
    if (!props.title.trim()) throw new Error('عنوان هدف الزامی است');
    if (!props.whyStatement.trim()) throw new Error('دلیل و چرایی هدف (Why) الزامی است');
    if (!props.deadline) throw new Error('تعیین مهلت پایان هدف الزامی است');

    const level = props.hierarchyLevel || 1;
    if (level < 1 || level > 3) {
      throw new Error('سطح سلسله‌مراتب هدف باید ۱ (سالانه)، ۲ (فصلی) یا ۳ (ماهانه) باشد');
    }

    const weight = props.weight !== undefined ? props.weight : 1;
    if (weight <= 0) {
      throw new Error('وزن هدف در سلسله‌مراتب باید بزرگتر از صفر باشد');
    }

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
    this.parentId = props.parentId?.trim() || undefined;
    this.hierarchyLevel = level;
    this.weight = weight;
    this.blockedByGoalIds = props.blockedByGoalIds ? [...props.blockedByGoalIds] : [];
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * آیا این هدف ریشه (Root / Level 1) است؟
   */
  get isRoot(): boolean {
    return !this.parentId || this.hierarchyLevel === 1;
  }

  /**
   * آیا این هدف می‌تواند دارای فرزند باشد؟ (حداکثر عمق = ۳)
   */
  get canHaveChildren(): boolean {
    return this.hierarchyLevel < 3;
  }

  /**
   * برچسب سطح سلسله‌مراتب
   */
  get hierarchyLevelLabel(): string {
    switch (this.hierarchyLevel) {
      case 1:
        return 'هدف سالانه (استراتژیک)';
      case 2:
        return 'هدف فصلی (مرحله‌ای)';
      case 3:
        return 'هدف ماهانه (تاکتیکی)';
    }
  }

  /**
   * محاسبه مدت زمان واقعی یا جاری هدف به روز
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

  withHierarchy(
    props: { parentId?: string; hierarchyLevel?: GoalHierarchyLevel; weight?: number },
    updatedAtIso: string
  ): Goal {
    return new Goal({
      ...this,
      parentId: props.parentId !== undefined ? props.parentId : this.parentId,
      hierarchyLevel: props.hierarchyLevel !== undefined ? props.hierarchyLevel : this.hierarchyLevel,
      weight: props.weight !== undefined ? props.weight : this.weight,
      updatedAt: updatedAtIso
    });
  }

  withDependencies(blockedByGoalIds: readonly string[], updatedAtIso: string): Goal {
    return new Goal({
      ...this,
      blockedByGoalIds,
      updatedAt: updatedAtIso
    });
  }
}
