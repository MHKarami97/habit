import { describe, it, expect } from 'vitest';
import { Goal } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import { GoalStateMachine, InvalidGoalStatusTransitionError } from '@/domain/state-machine/GoalStateMachine';

const createGoal = (params: {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'abandoned';
  parentId?: string;
  blockedByGoalIds?: string[];
}): Goal => {
  return new Goal({
    id: params.id,
    title: params.title,
    whyStatement: 'تست قوانین انتقال ستون‌های کانبان',
    categoryId: 'general',
    priority: 'medium',
    status: params.status,
    targetStartDate: '2026-03-21',
    deadline: '2026-06-20',
    metric: new MetricTarget({
      startValue: 0,
      targetValue: 10,
      currentValue: params.status === 'completed' ? 10 : 0,
      unit: 'مورد'
    }),
    hierarchyLevel: params.parentId ? 2 : 1,
    weight: 1,
    parentId: params.parentId,
    blockedByGoalIds: params.blockedByGoalIds ?? [],
    createdAt: '2026-03-21T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z'
  });
};

describe('Phase 3 Package 2: Kanban Transitions & State Machine Enforcement', () => {
  describe('Basic Column-to-Column Drag/Drop Validity', () => {
    it('allows dragging from draft to scheduled or active column', () => {
      expect(GoalStateMachine.canTransition('draft', 'scheduled')).toBe(true);
      expect(GoalStateMachine.canTransition('draft', 'active')).toBe(true);
    });

    it('rejects dragging directly from draft to completed or paused column', () => {
      expect(GoalStateMachine.canTransition('draft', 'completed')).toBe(false);
      expect(GoalStateMachine.canTransition('draft', 'paused')).toBe(false);
    });

    it('allows pausing an active goal and resuming a paused goal', () => {
      expect(GoalStateMachine.canTransition('active', 'paused')).toBe(true);
      expect(GoalStateMachine.canTransition('paused', 'active')).toBe(true);
    });

    it('allows reviving an abandoned goal back to draft', () => {
      expect(GoalStateMachine.canTransition('abandoned', 'draft')).toBe(true);
    });

    it('provides correct accessible next transition options for each status', () => {
      const draftAllowed = GoalStateMachine.getAllowedNextStatuses('draft');
      expect(draftAllowed).toEqual(['scheduled', 'active']);

      const activeAllowed = GoalStateMachine.getAllowedNextStatuses('active');
      expect(activeAllowed).toEqual(['paused', 'completed', 'abandoned']);

      const pausedAllowed = GoalStateMachine.getAllowedNextStatuses('paused');
      expect(pausedAllowed).toEqual(['active', 'abandoned']);
    });
  });

  describe('Contextual Constraints on Kanban Drag & Drop', () => {
    it('blocks dragging onto Active column if prerequisites are uncompleted', () => {
      const prereq = createGoal({ id: 'P1', title: 'پیش‌نیاز ناتمام', status: 'draft' });
      const mainGoal = createGoal({ id: 'M1', title: 'هدف اصلی', status: 'draft', blockedByGoalIds: ['P1'] });

      const check = GoalStateMachine.validateContextualTransition({
        goal: mainGoal,
        targetStatus: 'active',
        allGoals: [prereq, mainGoal]
      });

      expect(check.isAllowed).toBe(false);
      expect(check.error).toContain('پیش‌نیازهای زیر هنوز تکمیل نشده‌اند');
    });

    it('allows dragging onto Active column when all prerequisites are in Completed column', () => {
      const prereq = createGoal({ id: 'P1', title: 'پیش‌نیاز تمام‌شده', status: 'completed' });
      const mainGoal = createGoal({ id: 'M1', title: 'هدف اصلی', status: 'draft', blockedByGoalIds: ['P1'] });

      const check = GoalStateMachine.validateContextualTransition({
        goal: mainGoal,
        targetStatus: 'active',
        allGoals: [prereq, mainGoal]
      });

      expect(check.isAllowed).toBe(true);
      expect(check.error).toBeUndefined();
    });

    it('blocks dragging a parent goal onto Completed column if any child is in Active or Draft column', () => {
      const parent = createGoal({ id: 'parent', title: 'والد', status: 'active' });
      const child = createGoal({ id: 'child', title: 'فرزند', status: 'active', parentId: 'parent' });

      const check = GoalStateMachine.validateContextualTransition({
        goal: parent,
        targetStatus: 'completed',
        allGoals: [parent, child]
      });

      expect(check.isAllowed).toBe(false);
      expect(check.error).toContain('هدف زیرمجموعه آن ناتمام هستند');
    });
  });
});
