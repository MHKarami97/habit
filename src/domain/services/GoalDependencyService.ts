import type { Goal } from '../entities/Goal';

export class CircularDependencyError extends Error {
  constructor(
    public readonly cyclePath: readonly string[],
    message?: string
  ) {
    super(message || `وابستگی دایره‌ای شناسایی شد: ${cyclePath.join(' ← ')}`);
    this.name = 'CircularDependencyError';
  }
}

export class GoalDependencyService {
  /**
   * بررسی و اعتبارسنجی عدم وجود وابستگی دایره‌ای (Cycle Detection)
   * تضمین می‌کند افزودن پیش‌نیازها گراف جهت‌دار بدون دور (DAG) باقی بماند
   */
  static validateNoCycle(
    targetGoalId: string,
    candidatePrerequisiteIds: readonly string[],
    allGoals: readonly Goal[]
  ): void {
    // ۱. بررسی وابستگی مستقیم به خود
    if (candidatePrerequisiteIds.includes(targetGoalId)) {
      throw new CircularDependencyError(
        [targetGoalId, targetGoalId],
        'یک هدف نمی‌تواند پیش‌نیاز خودش باشد.'
      );
    }

    // ساخت مپ سریع برای دسترسی به اهداف
    const goalsMap = new Map<string, Goal>();
    for (const g of allGoals) {
      goalsMap.set(g.id, g);
    }

    // ۲. بررسی مسیرهای موجود از candidatePrerequisites به targetGoalId
    // اگر مسیری از هریک از کاندیدها به targetGoalId وجود داشته باشد،
    // اتصال targetGoalId -> candidate باعث ایجاد دور می‌شود.
    for (const prereqId of candidatePrerequisiteIds) {
      const visited = new Set<string>();
      const currentPath: string[] = [targetGoalId, prereqId];

      const hasPath = this.dfsFindPath(prereqId, targetGoalId, goalsMap, visited, currentPath);
      if (hasPath) {
        const pathTitles = currentPath.map(id => goalsMap.get(id)?.title || id);
        throw new CircularDependencyError(
          pathTitles,
          `وابستگی دایره‌ای شناسایی شد: افزودن این پیش‌نیاز موجب چرخه نامعتبر می‌شود (${pathTitles.join(' ← ')}).`
        );
      }
    }
  }

  /**
   * جستجوی عمق‌اول (DFS) برای پیدا کردن مسیر بین دو گره در گراف وابستگی‌ها
   */
  private static dfsFindPath(
    currentId: string,
    targetId: string,
    goalsMap: Map<string, Goal>,
    visited: Set<string>,
    path: string[]
  ): boolean {
    if (currentId === targetId) {
      return true;
    }

    if (visited.has(currentId)) {
      return false;
    }

    visited.add(currentId);
    const currentGoal = goalsMap.get(currentId);
    if (!currentGoal || !currentGoal.blockedByGoalIds) {
      return false;
    }

    for (const nextPrereqId of currentGoal.blockedByGoalIds) {
      path.push(nextPrereqId);
      if (this.dfsFindPath(nextPrereqId, targetId, goalsMap, visited, path)) {
        return true;
      }
      path.pop();
    }

    return false;
  }

  /**
   * بررسی وضعیت مسدود بودن یک هدف بر اساس پیش‌نیازهایش
   */
  static checkPrerequisites(
    goal: Goal,
    allGoals: readonly Goal[]
  ): {
    isBlocked: boolean;
    uncompletedPrerequisites: readonly Goal[];
    completedPrerequisites: readonly Goal[];
  } {
    if (!goal.blockedByGoalIds || goal.blockedByGoalIds.length === 0) {
      return {
        isBlocked: false,
        uncompletedPrerequisites: [],
        completedPrerequisites: []
      };
    }

    const goalsMap = new Map<string, Goal>();
    for (const g of allGoals) {
      goalsMap.set(g.id, g);
    }

    const uncompleted: Goal[] = [];
    const completed: Goal[] = [];

    for (const prereqId of goal.blockedByGoalIds) {
      const prereq = goalsMap.get(prereqId);
      if (prereq) {
        if (prereq.status === 'completed') {
          completed.push(prereq);
        } else {
          uncompleted.push(prereq);
        }
      }
    }

    return {
      isBlocked: uncompleted.length > 0,
      uncompletedPrerequisites: uncompleted,
      completedPrerequisites: completed
    };
  }
}
