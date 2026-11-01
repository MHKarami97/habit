export type GoalStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned';

export const ALL_GOAL_STATUSES: readonly GoalStatus[] = [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'abandoned'
] as const;

export function getGoalStatusLabel(status: GoalStatus): string {
  switch (status) {
    case 'draft':
      return 'پیش‌نویس';
    case 'scheduled':
      return 'برنامه‌ریزی‌شده';
    case 'active':
      return 'فعال';
    case 'paused':
      return 'متوقف';
    case 'completed':
      return 'تکمیل‌شده';
    case 'abandoned':
      return 'رهاشده';
  }
}
