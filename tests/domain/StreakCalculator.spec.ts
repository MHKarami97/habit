import { describe, it, expect } from 'vitest';
import { StreakCalculator } from '@/domain/services/StreakCalculator';
import { Habit } from '@/domain/entities/Habit';
import { HabitLog } from '@/domain/entities/HabitLog';

describe('StreakCalculator', () => {
  const baseHabit = new Habit({
    id: 'h1',
    title: 'مطالعه روزانه',
    icon: 'book',
    color: '#D2532A',
    categoryId: 'growth',
    habitType: 'boolean',
    recurrence: { type: 'daily' },
    dailyTarget: 1,
    unit: 'بار',
    reminderTimes: ['21:00'],
    startDate: '2026-11-01',
    isPaused: false,
    isArchived: false,
    weeklyFreezeAllowed: true,
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z'
  });

  it('calculates 3-day streak correctly', () => {
    const logs = [
      new HabitLog({ id: 'l1', habitId: 'h1', date: '2026-11-01', value: 1, isCompleted: true, isFrozen: false, createdAt: '' }),
      new HabitLog({ id: 'l2', habitId: 'h1', date: '2026-11-02', value: 1, isCompleted: true, isFrozen: false, createdAt: '' }),
      new HabitLog({ id: 'l3', habitId: 'h1', date: '2026-11-03', value: 1, isCompleted: true, isFrozen: false, createdAt: '' })
    ];

    const result = StreakCalculator.calculate(baseHabit, logs, '2026-11-03');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.adherenceRate).toBe(100);
  });

  it('preserves soft streak when a day is frozen', () => {
    const logs = [
      new HabitLog({ id: 'l1', habitId: 'h1', date: '2026-11-01', value: 1, isCompleted: true, isFrozen: false, createdAt: '' }),
      new HabitLog({ id: 'l2', habitId: 'h1', date: '2026-11-02', value: 0, isCompleted: false, isFrozen: true, createdAt: '' }), // Frozen day!
      new HabitLog({ id: 'l3', habitId: 'h1', date: '2026-11-03', value: 1, isCompleted: true, isFrozen: false, createdAt: '' })
    ];

    const result = StreakCalculator.calculate(baseHabit, logs, '2026-11-03');
    expect(result.currentStreak).toBe(3); // Streak is unbroken thanks to freeze
  });

  it('breaks streak when a due day is missed without freeze', () => {
    const logs = [
      new HabitLog({ id: 'l1', habitId: 'h1', date: '2026-11-01', value: 1, isCompleted: true, isFrozen: false, createdAt: '' }),
      // 2026-11-02 is missing and not frozen
      new HabitLog({ id: 'l3', habitId: 'h1', date: '2026-11-03', value: 1, isCompleted: true, isFrozen: false, createdAt: '' })
    ];

    const result = StreakCalculator.calculate(baseHabit, logs, '2026-11-03');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.adherenceRate).toBe(67);
  });

  it('marks 21-day milestone as "میان‌راه" accurately', () => {
    const logs: HabitLog[] = [];
    for (let i = 1; i <= 21; i++) {
      const d = String(i).padStart(2, '0');
      logs.push(new HabitLog({
        id: `l${i}`,
        habitId: 'h1',
        date: `2026-11-${d}`,
        value: 1,
        isCompleted: true,
        isFrozen: false,
        createdAt: ''
      }));
    }

    const result = StreakCalculator.calculate(baseHabit, logs, '2026-11-21');
    expect(result.currentStreak).toBe(21);
    const m21 = result.milestones.find(m => m.targetDays === 21);
    expect(m21?.isReached).toBe(true);
    expect(m21?.title).toContain('میان‌راه');
  });
});
