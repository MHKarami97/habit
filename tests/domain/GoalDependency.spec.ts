import { describe, it, expect } from 'vitest';
import { Goal } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import {
  GoalDependencyService,
  CircularGoalDependencyError
} from '@/domain/services/GoalDependencyService';

const createGoalWithPrereqs = (params: {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'scheduled';
  blockedByGoalIds: string[];
}): Goal => {
  return new Goal({
    id: params.id,
    title: params.title,
    whyStatement: 'تست وابستگی و پیش‌نیازها',
    categoryId: 'general',
    priority: 'medium',
    status: params.status,
    targetStartDate: '2026-03-21',
    deadline: '2026-06-20',
    metric: new MetricTarget({
      startValue: 0,
      targetValue: 10,
      currentValue: params.status === 'completed' ? 10 : 0,
      unit: 'واحد'
    }),
    hierarchyLevel: 1,
    weight: 1,
    blockedByGoalIds: params.blockedByGoalIds,
    createdAt: '2026-03-21T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z'
  });
};

describe('Phase 3 Package 1: GoalDependencyService', () => {
  describe('Cycle Detection (DFS graph traversal)', () => {
    it('detects and rejects self-dependency (A -> A)', () => {
      const goalA = createGoalWithPrereqs({
        id: 'goal-A',
        title: 'هدف الف',
        status: 'draft',
        blockedByGoalIds: []
      });

      expect(() => {
        GoalDependencyService.validateNoCycle('goal-A', ['goal-A'], [goalA]);
      }).toThrow(CircularGoalDependencyError);
    });

    it('detects and rejects direct mutual cycle (A -> B -> A)', () => {
      // Goal B already depends on Goal A
      const goalA = createGoalWithPrereqs({
        id: 'goal-A',
        title: 'هدف الف',
        status: 'draft',
        blockedByGoalIds: []
      });
      const goalB = createGoalWithPrereqs({
        id: 'goal-B',
        title: 'هدف ب',
        status: 'draft',
        blockedByGoalIds: ['goal-A']
      });

      // Trying to make Goal A depend on Goal B -> Cycle!
      expect(() => {
        GoalDependencyService.validateNoCycle('goal-A', ['goal-B'], [goalA, goalB]);
      }).toThrow(CircularGoalDependencyError);
    });

    it('detects and rejects indirect 3-step cycle (A -> B -> C -> A)', () => {
      // C depends on B, B depends on A
      const goalA = createGoalWithPrereqs({
        id: 'A',
        title: 'A',
        status: 'draft',
        blockedByGoalIds: []
      });
      const goalB = createGoalWithPrereqs({
        id: 'B',
        title: 'B',
        status: 'draft',
        blockedByGoalIds: ['A']
      });
      const goalC = createGoalWithPrereqs({
        id: 'C',
        title: 'C',
        status: 'draft',
        blockedByGoalIds: ['B']
      });

      // Now trying to make A depend on C
      expect(() => {
        GoalDependencyService.validateNoCycle('A', ['C'], [goalA, goalB, goalC]);
      }).toThrow(CircularGoalDependencyError);
    });

    it('allows valid Directed Acyclic Graph (DAG) dependencies without cycles', () => {
      // Structure: Goal C depends on A and B; Goal B depends on A. (Diamond / linear DAG)
      const goalA = createGoalWithPrereqs({ id: 'A', title: 'A', status: 'completed', blockedByGoalIds: [] });
      const goalB = createGoalWithPrereqs({ id: 'B', title: 'B', status: 'active', blockedByGoalIds: ['A'] });
      const goalC = createGoalWithPrereqs({ id: 'C', title: 'C', status: 'draft', blockedByGoalIds: [] });

      expect(() => {
        GoalDependencyService.validateNoCycle('C', ['A', 'B'], [goalA, goalB, goalC]);
      }).not.toThrow();
    });
  });

  describe('Prerequisite Completion Check', () => {
    it('returns isBlocked: false when goal has no prerequisites', () => {
      const goal = createGoalWithPrereqs({ id: 'G1', title: 'آزاد', status: 'draft', blockedByGoalIds: [] });
      const check = GoalDependencyService.checkPrerequisites(goal, [goal]);

      expect(check.isBlocked).toBe(false);
      expect(check.uncompletedPrerequisites).toHaveLength(0);
    });

    it('returns isBlocked: false when all prerequisites are in completed status', () => {
      const p1 = createGoalWithPrereqs({ id: 'P1', title: 'پیش‌نیاز ۱', status: 'completed', blockedByGoalIds: [] });
      const p2 = createGoalWithPrereqs({ id: 'P2', title: 'پیش‌نیاز ۲', status: 'completed', blockedByGoalIds: [] });
      const main = createGoalWithPrereqs({ id: 'Main', title: 'هدف اصلی', status: 'draft', blockedByGoalIds: ['P1', 'P2'] });

      const check = GoalDependencyService.checkPrerequisites(main, [p1, p2, main]);
      expect(check.isBlocked).toBe(false);
      expect(check.uncompletedPrerequisites).toHaveLength(0);
    });

    it('returns isBlocked: true when any prerequisite is not completed', () => {
      const p1 = createGoalWithPrereqs({ id: 'P1', title: 'پیش‌نیاز ۱', status: 'completed', blockedByGoalIds: [] });
      const p2 = createGoalWithPrereqs({ id: 'P2', title: 'پیش‌نیاز ۲', status: 'active', blockedByGoalIds: [] });
      const main = createGoalWithPrereqs({ id: 'Main', title: 'هدف اصلی', status: 'draft', blockedByGoalIds: ['P1', 'P2'] });

      const check = GoalDependencyService.checkPrerequisites(main, [p1, p2, main]);
      expect(check.isBlocked).toBe(true);
      expect(check.uncompletedPrerequisites).toHaveLength(1);
      expect(check.uncompletedPrerequisites[0].id).toBe('P2');
    });
  });
});
