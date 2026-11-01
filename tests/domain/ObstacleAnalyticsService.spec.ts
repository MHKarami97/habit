import { describe, it, expect } from 'vitest';
import { ObstacleAnalyticsService } from '../../src/domain/services/ObstacleAnalyticsService';
import type { ObstacleLog } from '../../src/domain/entities/ObstacleLog';
import type { Habit } from '../../src/domain/entities/Habit';
import type { HabitLog } from '../../src/domain/entities/HabitLog';

describe('Phase 2 Package 3: ObstacleAnalyticsService', () => {
  const mockHabit: Habit = {
    id: 'habit-evening-read',
    title: 'مطالعه کتاب شبانه',
    habitType: 'boolean',
    recurrence: { type: 'daily' },
    dailyTarget: 1,
    unit: 'بار',
    currentStreak: 5,
    bestStreak: 12,
    startDate: '2026-10-01',
    isPaused: false,
    isArchived: false,
    reminderTimes: ['21:30'], // عصرگاهی
    weeklyFreezeAllowed: true,
    freezesUsedThisWeek: 0
  };

  const mockObstacles: ObstacleLog[] = [
    {
      id: 'obs-1',
      goalId: 'goal-1',
      date: '2026-10-10',
      category: 'fatigue',
      description: 'خستگی مفرط بعد از کار',
      ifThenPlan: 'اگر خسته بودم، فقط ۱ پاراگراف می‌خوانم',
      createdAt: '2026-10-10T20:00:00Z'
    },
    {
      id: 'obs-2',
      goalId: 'goal-1',
      date: '2026-10-11',
      category: 'fatigue',
      description: 'افت انرژی شب',
      ifThenPlan: 'چرت کوتاه',
      createdAt: '2026-10-11T21:00:00Z'
    },
    {
      id: 'obs-3',
      goalId: 'goal-1',
      date: '2026-10-15',
      category: 'work_pressure',
      description: 'جلسات پی‌درپی تا شب',
      ifThenPlan: 'انجام کار در زمان ناهار',
      createdAt: '2026-10-15T18:00:00Z'
    }
  ];

  it('calculates accurate frequency distribution of obstacle categories', () => {
    const distribution = ObstacleAnalyticsService.calculateDistribution(mockObstacles);

    expect(distribution.length).toBe(2);
    // Fatigue is 2 out of 3 (67%)
    const fatigue = distribution.find(d => d.category === 'fatigue');
    expect(fatigue).toBeDefined();
    expect(fatigue?.count).toBe(2);
    expect(fatigue?.percentage).toBe(67);
    expect(fatigue?.label).toContain('خستگی');

    // Work pressure is 1 out of 3 (33%)
    const work = distribution.find(d => d.category === 'work_pressure');
    expect(work).toBeDefined();
    expect(work?.count).toBe(1);
    expect(work?.percentage).toBe(33);
  });

  it('computes correlation between obstacle category and habit streak breaks', () => {
    const habitLogsMap = new Map<string, HabitLog[]>();
    // Habit had 3 successful days, then failed on 2026-10-10 (streak break!)
    habitLogsMap.set(mockHabit.id, [
      { id: 'l1', habitId: mockHabit.id, date: '2026-10-07', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: 'l2', habitId: mockHabit.id, date: '2026-10-08', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: 'l3', habitId: mockHabit.id, date: '2026-10-09', value: 1, isCompleted: true, isFrozen: false, loggedAt: '' },
      { id: 'l4', habitId: mockHabit.id, date: '2026-10-10', value: 0, isCompleted: false, isFrozen: false, loggedAt: '' }
    ]);

    const correlations = ObstacleAnalyticsService.calculateStreakDropCorrelations({
      obstacles: mockObstacles,
      habits: [mockHabit],
      habitLogsMap
    });

    expect(correlations.length).toBeGreaterThanOrEqual(1);
    const topCorrelation = correlations[0];
    expect(topCorrelation?.category).toBe('fatigue');
    expect(topCorrelation?.breakCount).toBeGreaterThanOrEqual(1);
  });

  it('generates non-invasive actionable recommendations with explicit action triggers', () => {
    const correlations = [
      {
        category: 'fatigue' as const,
        label: 'خستگی جسمی یا ذهنی',
        breakCount: 3,
        breakPercentage: 60,
        dropImpactLevel: 'high' as const
      },
      {
        category: 'work_pressure' as const,
        label: 'فشار کاری و کمبود زمان',
        breakCount: 2,
        breakPercentage: 40,
        dropImpactLevel: 'medium' as const
      }
    ];

    const recommendations = ObstacleAnalyticsService.generateActionableRecommendations({
      obstacles: mockObstacles,
      correlations,
      activeGoalsCount: 4, // > 3 goals
      habits: [mockHabit]
    });

    // 1. Fatigue recommendation with morning action
    const fatigueRec = recommendations.find(r => r.type === 'move_to_morning');
    expect(fatigueRec).toBeDefined();
    expect(fatigueRec?.actionLabel).toContain('صبح');
    expect(fatigueRec?.actionPayload.suggestedReminderTime).toBe('07:30');
    expect(fatigueRec?.actionPayload.habitId).toBe(mockHabit.id);

    // 2. Work pressure recommendation with downscale action
    const workRec = recommendations.find(r => r.type === 'tiny_habit_downscale');
    expect(workRec).toBeDefined();
    expect(workRec?.actionLabel).toContain('هدف');

    // 3. Cognitive overload recommendation (>3 active goals)
    const goalsRec = recommendations.find(r => r.type === 'pause_low_priority_goals');
    expect(goalsRec).toBeDefined();
    expect(goalsRec?.insight).toContain('۴ هدف');
  });
});
