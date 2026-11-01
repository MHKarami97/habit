import { describe, it, expect } from 'vitest';
import { BehavioralTipEvaluator } from '../../src/presentation/data/behavioralTips';
import { GUIDE_ARTICLES } from '../../src/presentation/data/guideArticles';
import { FIELD_HELP_DATA } from '../../src/presentation/data/fieldHelpData';
import { GOAL_EXAMPLE_TEMPLATES, HABIT_EXAMPLE_TEMPLATES } from '../../src/presentation/data/interactiveExamples';
import type { Habit } from '../../src/domain/entities/Habit';
import type { Goal } from '../../src/domain/entities/Goal';
import type { HabitLog } from '../../src/domain/entities/HabitLog';
import type { ObstacleLog } from '../../src/domain/entities/ObstacleLog';

describe('Phase 2 Package 2: Comprehensive Guides & Behavioral System', () => {
  describe('BehavioralTipEvaluator', () => {
    it('detects when user missed check-ins for 3 consecutive days and suggests soft restart', () => {
      const mockHabits: Habit[] = [
        {
          id: 'h1',
          title: 'مطالعه روزانه',
          habitType: 'boolean',
          recurrence: { type: 'daily' },
          dailyTarget: 1,
          unit: 'بار',
          currentStreak: 0,
          bestStreak: 10,
          startDate: '2026-10-01',
          isPaused: false,
          isArchived: false,
          reminderTimes: [],
          weeklyFreezeAllowed: true,
          freezesUsedThisWeek: 0
        }
      ];

      const effectiveTodayIso = '2026-10-20';
      const recentLogsMap = new Map<string, readonly HabitLog[]>();
      // No logs on 2026-10-19, 2026-10-18, 2026-10-17
      recentLogsMap.set('h1', [
        {
          id: 'log-old',
          habitId: 'h1',
          date: '2026-10-15',
          value: 1,
          isCompleted: true,
          isFrozen: false,
          loggedAt: '2026-10-15T10:00:00Z'
        }
      ]);

      const tips = BehavioralTipEvaluator.evaluateTips({
        habits: mockHabits,
        goals: [],
        todayLogs: [],
        recentLogsMap,
        obstacles: [],
        effectiveTodayIso
      });

      const missedTip = tips.find(t => t.id === 'missed-3-days');
      expect(missedTip).toBeDefined();
      expect(missedTip?.type).toBe('encouragement');
      expect(missedTip?.sourceOrTone).toContain('لالی');
      expect(missedTip?.actionRoute).toBe('/guide?topic=soft_streaks');
    });

    it('warns when active goals exceed cognitive threshold of 3', () => {
      const mockGoals: Goal[] = ['g1', 'g2', 'g3', 'g4'].map(id => ({
        id,
        title: `هدف ${id}`,
        category: 'learning',
        priority: 'high',
        status: 'active',
        startValue: 0,
        currentValue: 10,
        targetValue: 100,
        unit: 'صفحه',
        startDate: '2026-10-01',
        deadline: '2026-12-01',
        isArchived: false,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z'
      }));

      const tips = BehavioralTipEvaluator.evaluateTips({
        habits: [],
        goals: mockGoals,
        todayLogs: [],
        recentLogsMap: new Map(),
        obstacles: [],
        effectiveTodayIso: '2026-10-20'
      });

      const highGoalsTip = tips.find(t => t.id === 'high-active-goals');
      expect(highGoalsTip).toBeDefined();
      expect(highGoalsTip?.type).toBe('warning');
      expect(highGoalsTip?.actionRoute).toBe('/guide?topic=smart_goals');
    });

    it('identifies fatigue pattern from structured obstacle logs and links to if-then planning', () => {
      const mockObstacles: ObstacleLog[] = [
        {
          id: 'o1',
          goalId: 'g1',
          date: '2026-10-18',
          category: 'fatigue',
          description: 'خستگی بعد از کار',
          ifThenPlan: 'اگر خسته بودم، ۵ دقیقه چرت می‌زنم',
          createdAt: '2026-10-18T18:00:00Z'
        },
        {
          id: 'o2',
          goalId: 'g1',
          date: '2026-10-19',
          category: 'fatigue',
          description: 'بی‌انرژی بودن شب',
          createdAt: '2026-10-19T21:00:00Z'
        },
        {
          id: 'o3',
          goalId: 'g1',
          date: '2026-10-20',
          category: 'distraction',
          description: 'گوشی موبایل',
          createdAt: '2026-10-20T14:00:00Z'
        }
      ];

      const tips = BehavioralTipEvaluator.evaluateTips({
        habits: [],
        goals: [],
        todayLogs: [],
        recentLogsMap: new Map(),
        obstacles: mockObstacles,
        effectiveTodayIso: '2026-10-20'
      });

      const fatigueTip = tips.find(t => t.id === 'obstacle-fatigue-pattern');
      expect(fatigueTip).toBeDefined();
      expect(fatigueTip?.type).toBe('research_insight');
      expect(fatigueTip?.sourceOrTone).toContain('گول‌ویتزر');
      expect(fatigueTip?.actionRoute).toBe('/guide?topic=if_then_plans');
    });
  });

  describe('Academic Guide Articles Integrity', () => {
    it('verifies that all guide articles have valid structure, key takeaways, and academic citations', () => {
      expect(GUIDE_ARTICLES.length).toBeGreaterThanOrEqual(5);

      for (const article of GUIDE_ARTICLES) {
        expect(article.id).toBeTruthy();
        expect(article.title).toBeTruthy();
        expect(article.summary).toBeTruthy();
        expect(article.readingTimeMinutes).toBeGreaterThan(0);
        expect(article.keyTakeaways.length).toBeGreaterThanOrEqual(2);
        expect(article.contentMarkdown).toBeTruthy();

        // Every article must have at least one scientific citation
        expect(article.academicCitations.length).toBeGreaterThanOrEqual(1);
        for (const citation of article.academicCitations) {
          expect(citation.authors).toBeTruthy();
          expect(citation.year).toBeGreaterThanOrEqual(1980);
          expect(citation.publication).toBeTruthy();
        }
      }
    });
  });

  describe('Field Help Dictionary & Interactive Examples', () => {
    it('verifies all field help entries include good and bad examples and scientific context', () => {
      const keys = Object.keys(FIELD_HELP_DATA);
      expect(keys.length).toBeGreaterThanOrEqual(5);

      for (const key of keys) {
        const item = FIELD_HELP_DATA[key];
        expect(item.title).toBeTruthy();
        expect(item.tip).toBeTruthy();
        expect(item.goodExample).toBeTruthy();
        expect(item.badExample).toBeTruthy();
        expect(item.commonPitfall).toBeTruthy();
      }
    });

    it('verifies interactive templates provide executable goal and habit definitions', () => {
      expect(GOAL_EXAMPLE_TEMPLATES.length).toBeGreaterThanOrEqual(3);
      for (const tmpl of GOAL_EXAMPLE_TEMPLATES) {
        expect(tmpl.title).toBeTruthy();
        expect(tmpl.data.targetValue).toBeGreaterThan(tmpl.data.startValue);
        expect(tmpl.data.unit).toBeTruthy();
      }

      expect(HABIT_EXAMPLE_TEMPLATES.length).toBeGreaterThanOrEqual(3);
      for (const tmpl of HABIT_EXAMPLE_TEMPLATES) {
        expect(tmpl.title).toBeTruthy();
        expect(tmpl.data.cue).toBeTruthy();
        expect(tmpl.data.dailyTarget).toBeGreaterThan(0);
      }
    });
  });
});
