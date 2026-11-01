/**
 * ماهیت دامنه: بازبینی دوره‌ای (هفتگی یا ماهانه)
 * ثبت ارزیابی‌های تأملی و محاسبات آماری پایبندی بدون وابستگی به فریم‌ورک
 */

export type PeriodicReviewType = 'weekly' | 'monthly';

export interface PeriodicReviewProps {
  readonly id: string;
  readonly type: PeriodicReviewType;
  readonly periodKey: string; // e.g. "1405-W32" or "1405-08"
  readonly solarYear: number;
  readonly solarPeriod: number; // week 1-52 or month 1-12
  readonly periodLabel: string; // e.g. "هفته ۳۲ سال ۱۴۰۵" یا "آبان ۱۴۰۵"
  readonly startDateIso: string;
  readonly endDateIso: string;
  readonly whatWorked: string;
  readonly whatDidntWork: string;
  readonly primaryObstacle: string;
  readonly actionPlan: string;
  readonly adherenceRate: number; // 0 to 100
  readonly completedHabitsCount: number;
  readonly totalExpectedHabits: number;
  readonly activeGoalsCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class PeriodicReview {
  readonly id: string;
  readonly type: PeriodicReviewType;
  readonly periodKey: string;
  readonly solarYear: number;
  readonly solarPeriod: number;
  readonly periodLabel: string;
  readonly startDateIso: string;
  readonly endDateIso: string;
  readonly whatWorked: string;
  readonly whatDidntWork: string;
  readonly primaryObstacle: string;
  readonly actionPlan: string;
  readonly adherenceRate: number;
  readonly completedHabitsCount: number;
  readonly totalExpectedHabits: number;
  readonly activeGoalsCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: PeriodicReviewProps) {
    if (!props.id) throw new Error('شناسه بازبینی دوره‌ای الزامی است');
    if (!props.periodKey) throw new Error('کلید دوره الزامی است');
    if (props.adherenceRate < 0 || props.adherenceRate > 100) {
      throw new Error('نرخ پایبندی باید بین ۰ تا ۱۰۰ باشد');
    }

    this.id = props.id;
    this.type = props.type;
    this.periodKey = props.periodKey;
    this.solarYear = props.solarYear;
    this.solarPeriod = props.solarPeriod;
    this.periodLabel = props.periodLabel.trim();
    this.startDateIso = props.startDateIso;
    this.endDateIso = props.endDateIso;
    this.whatWorked = props.whatWorked.trim();
    this.whatDidntWork = props.whatDidntWork.trim();
    this.primaryObstacle = props.primaryObstacle.trim();
    this.actionPlan = props.actionPlan.trim();
    this.adherenceRate = Math.round(props.adherenceRate);
    this.completedHabitsCount = props.completedHabitsCount;
    this.totalExpectedHabits = props.totalExpectedHabits;
    this.activeGoalsCount = props.activeGoalsCount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
