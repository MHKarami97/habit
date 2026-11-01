export type GoalPriority = 'low' | 'medium' | 'high';

export const GOAL_PRIORITIES: readonly GoalPriority[] = ['low', 'medium', 'high'] as const;

export function getGoalPriorityLabel(priority: GoalPriority): string {
  switch (priority) {
    case 'low':
      return 'پایین';
    case 'medium':
      return 'متوسط';
    case 'high':
      return 'بالا';
  }
}
