export type ObstacleCategory =
  | 'fatigue'
  | 'screen_time'
  | 'work_pressure'
  | 'low_motivation'
  | 'procrastination'
  | 'unexpected_event'
  | 'custom';

export interface ObstacleLogProps {
  readonly id: string;
  readonly goalId: string;
  readonly date: string; // YYYY-MM-DD
  readonly category: ObstacleCategory;
  readonly customCategory?: string;
  readonly note: string;
  readonly ifThenPlan: string;
  readonly createdAt: string;
}

export function getObstacleCategoryLabel(category: ObstacleCategory, customName?: string): string {
  switch (category) {
    case 'fatigue':
      return 'خستگی جسمی یا ذهنی';
    case 'screen_time':
      return 'حواس‌پرتی با گوشی و شبکه‌های اجتماعی';
    case 'work_pressure':
      return 'فشار کاری و کمبود زمان';
    case 'low_motivation':
      return 'بی‌انگیزگی یا تردید در هدف';
    case 'procrastination':
      return 'اهمال‌کاری و به تعویق انداختن';
    case 'unexpected_event':
      return 'پیشامد غیرمنتظره و اورژانسی';
    case 'custom':
      return customName?.trim() || 'سایر موانع شخصی';
  }
}

export class ObstacleLog {
  readonly id: string;
  readonly goalId: string;
  readonly date: string;
  readonly category: ObstacleCategory;
  readonly customCategory?: string;
  readonly note: string;
  readonly ifThenPlan: string;
  readonly createdAt: string;

  constructor(props: ObstacleLogProps) {
    if (!props.id) throw new Error('شناسه مانع الزامی است');
    if (!props.ifThenPlan.trim()) throw new Error('برنامه «اگر-آنگاه» الزامی است');
    this.id = props.id;
    this.goalId = props.goalId;
    this.date = props.date;
    this.category = props.category;
    this.customCategory = props.customCategory?.trim() || undefined;
    this.note = props.note.trim();
    this.ifThenPlan = props.ifThenPlan.trim();
    this.createdAt = props.createdAt;
  }
}
