export type HabitType = 'boolean' | 'numeric' | 'duration' | 'quit';

export const ALL_HABIT_TYPES: readonly HabitType[] = [
  'boolean',
  'numeric',
  'duration',
  'quit'
] as const;

export function getHabitTypeLabel(type: HabitType): string {
  switch (type) {
    case 'boolean':
      return 'انجام شد / نشد';
    case 'numeric':
      return 'مقداری (تعداد، صفحه و...)';
    case 'duration':
      return 'زمانی (دقیقه)';
    case 'quit':
      return 'ترک‌کردنی (پرهیز)';
  }
}
