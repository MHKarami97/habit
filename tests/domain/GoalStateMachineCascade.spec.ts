import { describe, it, expect } from 'vitest';
import { Goal } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import { GoalStateMachine } from '@/domain/state-machine/GoalStateMachine';

const createGoal = (params: {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'abandoned' | 'scheduled';
  parentId?: string;
  blockedByGoalIds?: string[];
}): Goal => {
  return new Goal({
    id: params.id,
    title: params.title,
    whyStatement: 'تست ماشین وضعیت با سلسله‌مراتب و پیش‌نیازها',
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
    hierarchyLevel: params.parentId ? 2 : 1,
    weight: 1,
    parentId: params.parentId,
    blockedByGoalIds: params.blockedByGoalIds ?? [],
    createdAt: '2026-03-21T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z'
  });
};

describe('Phase 3 Package 1: GoalStateMachine Hierarchy & Dependency Cascade Rules', () => {
  describe('Rule 1: Prerequisite completion check on activation', () => {
    it('rejects transitioning to active if any prerequisite is uncompleted', () => {
      const prereq = createGoal({ id: 'P1', title: 'پیش‌نیاز ناتمام', status: 'active' });
      const target = createGoal({ id: 'T1', title: 'هدف وابسته', status: 'draft', blockedByGoalIds: ['P1'] });

      const result = GoalStateMachine.validateContextualTransition({
        goal: target,
        targetStatus: 'active',
        allGoals: [prereq, target]
      });

      expect(result.isAllowed).toBe(false);
      expect(result.error).toContain('پیش‌نیازهای زیر هنوز تکمیل نشده‌اند');
      expect(result.error).toContain('پیش‌نیاز ناتمام');
    });

    it('allows transitioning to active if all prerequisites are completed', () => {
      const prereq = createGoal({ id: 'P1', title: 'پیش‌نیاز تمام‌شده', status: 'completed' });
      const target = createGoal({ id: 'T1', title: 'هدف وابسته', status: 'draft', blockedByGoalIds: ['P1'] });

      const result = GoalStateMachine.validateContextualTransition({
        goal: target,
        targetStatus: 'active',
        allGoals: [prereq, target]
      });

      expect(result.isAllowed).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Rule 2: Parent completion check on children', () => {
    it('rejects completing a parent goal if any direct child is not completed', () => {
      const parent = createGoal({ id: 'parent', title: 'هدف والد', status: 'active' });
      const child1 = createGoal({ id: 'c1', title: 'فرزند تکمیل‌شده', status: 'completed', parentId: 'parent' });
      const child2 = createGoal({ id: 'c2', title: 'فرزند فعال ناتمام', status: 'active', parentId: 'parent' });

      const result = GoalStateMachine.validateContextualTransition({
        goal: parent,
        targetStatus: 'completed',
        allGoals: [parent, child1, child2]
      });

      expect(result.isAllowed).toBe(false);
      expect(result.error).toContain('هدف والد «هدف والد» نمی‌تواند تکمیل شود');
      expect(result.error).toContain('فرزند فعال ناتمام');
    });

    it('allows completing a parent goal if all direct children are completed', () => {
      const parent = createGoal({ id: 'parent', title: 'هدف والد', status: 'active' });
      const child1 = createGoal({ id: 'c1', title: 'فرزند اول', status: 'completed', parentId: 'parent' });
      const child2 = createGoal({ id: 'c2', title: 'فرزند دوم', status: 'completed', parentId: 'parent' });

      const result = GoalStateMachine.validateContextualTransition({
        goal: parent,
        targetStatus: 'completed',
        allGoals: [parent, child1, child2]
      });

      expect(result.isAllowed).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Rule 3 & 4: Cascading transitions', () => {
    it('cascades abandoned from parent to all non-completed children', () => {
      const parent = createGoal({ id: 'parent', title: 'هدف والد', status: 'active' });
      const childActive = createGoal({ id: 'c-act', title: 'فرزند فعال', status: 'active', parentId: 'parent' });
      const childPaused = createGoal({ id: 'c-pause', title: 'فرزند متوقف', status: 'paused', parentId: 'parent' });
      const childCompleted = createGoal({ id: 'c-comp', title: 'فرزند تکمیل', status: 'completed', parentId: 'parent' });

      const result = GoalStateMachine.validateContextualTransition({
        goal: parent,
        targetStatus: 'abandoned',
        allGoals: [parent, childActive, childPaused, childCompleted]
      });

      expect(result.isAllowed).toBe(true);
      expect(result.cascadeStatusForChildren).toBe('abandoned');
      expect(result.affectedChildren).toHaveLength(2);
      const affectedIds = result.affectedChildren?.map(c => c.id);
      expect(affectedIds).toContain('c-act');
      expect(affectedIds).toContain('c-pause');
      expect(affectedIds).not.toContain('c-comp');
    });

    it('cascades paused from parent to active children', () => {
      const parent = createGoal({ id: 'parent', title: 'هدف والد', status: 'active' });
      const childActive = createGoal({ id: 'c1', title: 'فرزند فعال', status: 'active', parentId: 'parent' });
      const childDraft = createGoal({ id: 'c2', title: 'فرزند پیش‌نویس', status: 'draft', parentId: 'parent' });

      const result = GoalStateMachine.validateContextualTransition({
        goal: parent,
        targetStatus: 'paused',
        allGoals: [parent, childActive, childDraft]
      });

      expect(result.isAllowed).toBe(true);
      expect(result.cascadeStatusForChildren).toBe('paused');
      expect(result.affectedChildren).toHaveLength(1);
      expect(result.affectedChildren?.[0].id).toBe('c1');
    });

    it('cascades active from parent to paused children when resuming', () => {
      const parent = createGoal({ id: 'parent', title: 'هدف والد', status: 'paused' });
      const childPaused = createGoal({ id: 'c1', title: 'فرزند متوقف', status: 'paused', parentId: 'parent' });

      const result = GoalStateMachine.validateContextualTransition({
        goal: parent,
        targetStatus: 'active',
        allGoals: [parent, childPaused]
      });

      expect(result.isAllowed).toBe(true);
      expect(result.cascadeStatusForChildren).toBe('active');
      expect(result.affectedChildren).toHaveLength(1);
      expect(result.affectedChildren?.[0].id).toBe('c1');
    });
  });
});
