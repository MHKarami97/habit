import { describe, it, expect } from 'vitest';
import { PeriodicReviewService } from '../../src/domain/services/PeriodicReviewService';
import type { Habit } from '../../src/domain/entities/Habit';
import type { HabitLog } from '../../src/domain/entities/HabitLog';
import type { Goal } from '../../src/domain/entities/Goal';

describe('Phase 2 Package 3: PeriodicReviewService', () => {
  const mockHabits: Habit[] = [
    {
      id: 'h1',
      title: 'ورزش روزانه',
      habitType: 'boolean',
      recurrence: { type: 'daily' },
      dailyTarget: 1,
      unit: 'بار',
      currentStreak: 5,
      bestStreak: 10,
      startDate: '2026-10-01',
      isPaused: false,
      isArchived: false,
      reminderTimes: [],
      weeklyFreezeAllowed: true,
      freezesUsedThisWeek: 0
    },
    {
      id: 'h2',
      title: 'مطالعه روزانه',
      habitType: 'boolean',
      recurrence: { type: 'daily' },
      dailyTarget: 1,
      unit: 'بار',
      currentStreak: 3,
      bestStreak: 7,
      startDate: '2026-10-01',
      isPaused: false,
      isArchived: false,
      reminderTimes: [],
      weeklyFreezeAllowed: true,
      freezesUsedThisWeek: 0
    }
  ];

  const mockGoals: Goal[] = [
    {
      id: 'g1',
      title: 'هدف فعال ۱',
      category: 'health',
      priority: 'high',
      status: 'active',
      startValue: 0,
      currentValue: 5,
      targetValue: 10,
      unit: 'جلسه',
      startDate: '2026-10-01',
      deadline: '2026-11-01',
      isArchived: false,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z'
    }
  ];

  it('calculates accurate adherence rate and expected check-ins for a 7-day period', () => {
    const startDateIso = '2026-10-10';
    const endDateIso = '2026-10-16'; // 7 days: 2 daily habits * 7 = 14 expected check-ins

    const mockLogs: HabitLog[] = [
      // 10 completed check-ins out of 14 expected
      { id: '1', habitId: 'h1', date: '2026-10-10', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '2', habitId: 'h1', date: '2026-10-11', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '3', habitId: 'h1', date: '2026-10-12', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '4', habitId: 'h1', date: '2026-10-13', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '5', habitId: 'h1', date: '2026-10-14', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '6', habitId: 'h2', date: '2026-10-10', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '7', habitId: 'h2', date: '2026-10-11', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '8', habitId: 'h2', date: '2026-10-12', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '9', habitId: 'h2', date: '2026-10-13', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: '10', habitId: 'h2', date: '2026-10-14', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' }
    ];

    const stats = PeriodicReviewService.calculatePeriodStats({
      startDateIso,
      endDateIso,
      habits: mockHabits,
      habitLogs: mockLogs,
      goals: mockGoals
    });

    expect(stats.totalExpectedHabits).toBe(14);
    expect(stats.completedHabitsCount).toBe(10);
    // 10 / 14 = 71.4% -> 71%
    expect(stats.adherenceRate).toBe(71);
    expect(stats.activeGoalsCount).toBe(1);
  });

  it('determines Persian weekly period keys and date boundaries correctly', () => {
    // 2026-11-01 is in Aban 1405
    const info = PeriodicReviewService.getPeriodInfo('weekly', '2026-11-01');

    expect(info.solarYear).toBe(1405);
    expect(info.periodKey).toMatch(/^1405-W\d{2}$/);
    expect(info.periodLabel).toContain('هفته');
    expect(info.periodLabel).toContain('۱۴۰۵');
    expect(info.startDateIso).toBeDefined();
    expect(info.endDateIso).toBeDefined();
    expect(info.startDateIso < info.endDateIso).toBe(true);
  });

  it('determines Persian monthly period keys and month boundaries correctly', () => {
    // 2026-11-01 is in Aban (Month 8) of 1405
    const info = PeriodicReviewService.getPeriodInfo('monthly', '2026-11-01');

    expect(info.solarYear).toBe(1405);
    expect(info.solarPeriod).toBe(8); // آبان
    expect(info.periodKey).toBe('1405-08');
    expect(info.periodLabel).toBe('آبان ۱۴۰۵');
    expect(info.startDateIso).toBeDefined();
    expect(info.endDateIso).toBeDefined();
  });

  it('creates and validates a PeriodicReview domain entity', () => {
    const review = PeriodicReviewService.createReview({
      id: 'rev-test-1',
      type: 'weekly',
      periodKey: '1405-W32',
      solarYear: 1405,
      solarPeriod: 32,
      periodLabel: 'هفته ۳۲ سال ۱۴۰۵',
      startDateIso: '2026-10-24',
      endDateIso: '2026-10-30',
      whatWorked: 'تثبیت بیدار شدن سحرگاهی',
      whatDidntWork: 'کم‌توجهی به آب خوردن',
      primaryObstacle: 'مشغله کاری زیاد',
      actionPlan: 'نصب بطری آب روی میز کار',
      adherenceRate: 85,
      completedHabitsCount: 12,
      totalExpectedHabits: 14,
      activeGoalsCount: 2
    });

    expect(review.id).toBe('rev-test-1');
    expect(review.adherenceRate).toBe(85);
    expect(review.whatWorked).toBe('تثبیت بیدار شدن سحرگاهی');
    expect(review.createdAt).toBeTruthy();
  });
});
