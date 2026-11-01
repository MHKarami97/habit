import type { Goal, GoalHierarchyLevel } from '../entities/Goal';

export interface GoalTreeNode {
  readonly goal: Goal;
  readonly effectiveProgress: number; // پیشرفت محاسبه‌شده مستقل یا وزن‌دار از فرزندان
  readonly children: readonly GoalTreeNode[];
  readonly totalWeight: number;
}

export class GoalHierarchyService {
  /**
   * محاسبه پیشرفت وزن‌دار هدف والد بر اساس فرزندان مستقیم آن
   * اگر هدفی فرزندی نداشته باشد، پیشرفت مستقل سنجه خودش بازگردانده می‌شود
   */
  static calculateEffectiveProgress(
    goal: Goal,
    allGoals: readonly Goal[]
  ): number {
    const directChildren = allGoals.filter(g => g.parentId === goal.id && !g.isArchived);
    if (directChildren.length === 0) {
      return goal.metric.progressPercentage;
    }

    let totalWeight = 0;
    let weightedProgressSum = 0;

    for (const child of directChildren) {
      // بازگشتی: پیشرفت مؤثر هر فرزند (ممکن است خود فرزند نیز فرزندانی داشته باشد)
      const childProgress = this.calculateEffectiveProgress(child, allGoals);
      const childWeight = child.weight > 0 ? child.weight : 1;

      totalWeight += childWeight;
      weightedProgressSum += childProgress * childWeight;
    }

    if (totalWeight === 0) return 0;
    return Math.min(100, Math.round(weightedProgressSum / totalWeight));
  }

  /**
   * اعتبارسنجی مجاز بودن انتساب والد و کنترل سقف ۳ سطح عمق
   */
  static validateParentAssignment(
    childGoalId: string | undefined,
    parentId: string | undefined,
    allGoals: readonly Goal[]
  ): { isValid: boolean; hierarchyLevel: GoalHierarchyLevel; error?: string } {
    if (!parentId) {
      return { isValid: true, hierarchyLevel: 1 };
    }

    if (childGoalId && childGoalId === parentId) {
      return { isValid: false, hierarchyLevel: 1, error: 'یک هدف نمی‌تواند والد خودش باشد.' };
    }

    const goalsMap = new Map<string, Goal>();
    for (const g of allGoals) {
      goalsMap.set(g.id, g);
    }

    const parent = goalsMap.get(parentId);
    if (!parent) {
      return { isValid: false, hierarchyLevel: 1, error: 'هدف والد انتخاب‌شده یافت نشد.' };
    }

    // بررسی سقف عمق ۳ سطحی
    if (parent.hierarchyLevel >= 3) {
      return {
        isValid: false,
        hierarchyLevel: 3,
        error: 'حداکثر عمق سلسله‌مراتب اهداف ۳ سطح (سالانه ← فصلی ← ماهانه) است. هدف انتخابی نمی‌تواند فرزند دیگری داشته باشد.'
      };
    }

    // بررسی عدم انتساب یکی از فرزندان به عنوان والد (جلوگیری از دور در ساختار والد-فرزندی)
    if (childGoalId && this.isDescendant(childGoalId, parentId, goalsMap)) {
      return {
        isValid: false,
        hierarchyLevel: 1,
        error: 'نمی‌توانید یکی از زیرمجموعه‌های هدف را به عنوان والد آن انتخاب کنید.'
      };
    }

    const nextLevel = (parent.hierarchyLevel + 1) as GoalHierarchyLevel;
    return { isValid: true, hierarchyLevel: nextLevel };
  }

  /**
   * آیا گره candidateId از نوادگان ancestorId است؟
   */
  private static isDescendant(
    ancestorId: string,
    candidateId: string,
    goalsMap: Map<string, Goal>
  ): boolean {
    let curr = goalsMap.get(candidateId);
    while (curr && curr.parentId) {
      if (curr.parentId === ancestorId) {
        return true;
      }
      curr = goalsMap.get(curr.parentId);
    }
    return false;
  }

  /**
   * تبدیل آرایه خطی اهداف به ساختار درختی مرتب
   */
  static buildTree(allGoals: readonly Goal[]): GoalTreeNode[] {
    const activeGoals = allGoals.filter(g => !g.isArchived);
    const rootGoals = activeGoals.filter(g => g.isRoot);

    const buildNode = (goal: Goal): GoalTreeNode => {
      const children = activeGoals.filter(g => g.parentId === goal.id);
      const childNodes = children.map(buildNode);

      const effectiveProgress = this.calculateEffectiveProgress(goal, allGoals);
      const totalWeight = childNodes.reduce((sum, c) => sum + (c.goal.weight || 1), 0);

      return {
        goal,
        effectiveProgress,
        children: childNodes,
        totalWeight
      };
    };

    return rootGoals.map(buildNode);
  }
}
