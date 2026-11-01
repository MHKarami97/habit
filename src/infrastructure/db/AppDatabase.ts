import Dexie, { type Table } from 'dexie';

export interface GoalRecord {
  id: string;
  title: string;
  whyStatement: string;
  categoryId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'abandoned';
  targetStartDate: string;
  actualStartDate?: string;
  deadline: string;
  actualEndDate?: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  isArchived: number; // 0 or 1 for IndexedDB indexing
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneRecord {
  id: string;
  goalId: string;
  title: string;
  targetValue?: number;
  isCompleted: number; // 0 or 1
  dueDate?: string;
  sortOrder: number;
}

export interface ActionLogRecord {
  id: string;
  goalId: string;
  date: string; // YYYY-MM-DD
  description: string;
  progressDelta: number;
  durationMinutes: number;
  nextStep?: string;
  createdAt: string;
}

export interface ObstacleLogRecord {
  id: string;
  goalId: string;
  date: string;
  category: string;
  customCategory?: string;
  note: string;
  ifThenPlan: string;
  createdAt: string;
}

export interface HabitRecord {
  id: string;
  title: string;
  icon: string;
  color: string;
  categoryId: string;
  habitType: 'boolean' | 'numeric' | 'duration' | 'quit';
  recurrenceType: 'daily' | 'weekly_days' | 'frequency' | 'interval';
  recurrenceRuleJson: string;
  dailyTarget: number;
  unit: string;
  cue?: string;
  linkedGoalId?: string;
  reminderTimesJson: string;
  startDate: string;
  endDate?: string;
  isPaused: number;   // 0 or 1
  isArchived: number; // 0 or 1
  weeklyFreezeAllowed: number; // 0 or 1
  createdAt: string;
  updatedAt: string;
}

export interface HabitLogRecord {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number;
  isCompleted: number; // 0 or 1
  isFrozen: number;    // 0 or 1
  note?: string;
  createdAt: string;
}

export interface UserSettingsRecord {
  id: string; // 'singleton_settings'
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  numberFormat: 'persian' | 'latin';
  weekStartDay: number;
  endOfDayHour: number;
  notificationsEnabled: boolean;
  defaultReminderTime: string;
  lastBackupDate?: string;
  hasCompletedOnboarding: boolean;
  isStoragePersisted: boolean;
  schemaVersion: number;
}

export interface ReminderLogRecord {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  firedAt: string; // ISO
}

export interface PeriodicReviewRecord {
  id: string;
  type: 'weekly' | 'monthly';
  periodKey: string;
  solarYear: number;
  solarPeriod: number;
  periodLabel: string;
  startDateIso: string;
  endDateIso: string;
  whatWorked: string;
  whatDidntWork: string;
  primaryObstacle: string;
  actionPlan: string;
  adherenceRate: number;
  completedHabitsCount: number;
  totalExpectedHabits: number;
  activeGoalsCount: number;
  createdAt: string;
  updatedAt: string;
}

export class AppDatabase extends Dexie {
  goals!: Table<GoalRecord, string>;
  milestones!: Table<MilestoneRecord, string>;
  actionLogs!: Table<ActionLogRecord, string>;
  obstacleLogs!: Table<ObstacleLogRecord, string>;
  habits!: Table<HabitRecord, string>;
  habitLogs!: Table<HabitLogRecord, string>;
  settings!: Table<UserSettingsRecord, string>;
  reminderLogs!: Table<ReminderLogRecord, string>;
  periodicReviews!: Table<PeriodicReviewRecord, string>;

  constructor() {
    super('KavoshLocalDB');

    // نسخه ۱: اسکیمای پایه دیتابیس با ایندکس‌های مرکب
    this.version(1).stores({
      goals: 'id, status, categoryId, priority, deadline, isArchived, createdAt, updatedAt',
      milestones: 'id, goalId, isCompleted, sortOrder',
      actionLogs: 'id, goalId, date, [goalId+date], createdAt',
      obstacleLogs: 'id, goalId, date, category, [goalId+date]',
      habits: 'id, habitType, recurrenceType, linkedGoalId, isArchived, isPaused, createdAt',
      // ایندکس ترکیبی [habitId+date] جهت کوئری O(1) رکورد روزانه
      habitLogs: 'id, habitId, date, [habitId+date], isCompleted, isFrozen',
      settings: 'id'
    });

    // نسخه ۲ (فاز ۲ - بسته ۱): اضافه شدن جدول یادآورهای شلیک‌شده جهت جلوگیری از ارسال تکراری
    this.version(2).stores({
      reminderLogs: 'id, habitId, date, [habitId+date+time], firedAt'
    });

    // نسخه ۳ (فاز ۲ - بسته ۳): اضافه شدن جدول بازبینی‌های دوره‌ای هفتگی و ماهانه
    this.version(3).stores({
      periodicReviews: 'id, type, periodKey, [type+periodKey], solarYear, createdAt'
    });
  }
}

// نمونه یکتا (Singleton) از دیتابیس محلی
export const db = new AppDatabase();
