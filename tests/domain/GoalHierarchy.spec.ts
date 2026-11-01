import { describe, it, expect } from 'vitest';
import { Goal } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import { GoalHierarchyService } from '@/domain/services/GoalHierarchyService';

const createTestGoal = (params: {
  id: string;
  title: string;
  hierarchyLevel: 1 | 2 | 3;
  parentId?: string;
  weight?: number;
  currentValue?: number;
  targetValue?: number;
}): Goal => {
  return new Goal({
    id: params.id,
    title: params.title,
    whyStatement: 'برای رشد فردی و استمرار موفقیت',
    categoryId: 'general',
    priority: 'high',
    status: 'active',
    targetStartDate: '2026-03-21',
    deadline: '2027-03-20',
    metric: new MetricTarget({
      startValue: 0,
      targetValue: params.targetValue ?? 100,
      currentValue: params.currentValue ?? 0,
      unit: 'مورد'
    }),
    parentId: params.parentId,
    hierarchyLevel: params.hierarchyLevel,
    weight: params.weight ?? 1,
    blockedByGoalIds: [],
    createdAt: '2026-03-21T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z'
  });
};

describe('Phase 3 Package 1: GoalHierarchyService', () => {
  describe('Hierarchy depth & parent assignment rules', () => {
    it('allows assigning a Level 1 goal as parent, setting child level to 2', () => {
      const parent = createTestGoal({ id: 'g-root', title: 'هدف سالانه', hierarchyLevel: 1 });
      const validation = GoalHierarchyService.validateParentAssignment('g-child', 'g-root', [parent]);

      expect(validation.isValid).toBe(true);
      expect(validation.hierarchyLevel).toBe(2);
    });

    it('allows assigning a Level 2 goal as parent, setting child level to 3', () => {
      const root = createTestGoal({ id: 'g-root', title: 'هدف سالانه', hierarchyLevel: 1 });
      const seasonal = createTestGoal({
        id: 'g-seasonal',
        title: 'هدف فصلی',
        hierarchyLevel: 2,
        parentId: 'g-root'
      });

      const validation = GoalHierarchyService.validateParentAssignment(
        'g-monthly',
        'g-seasonal',
        [root, seasonal]
      );

      expect(validation.isValid).toBe(true);
      expect(validation.hierarchyLevel).toBe(3);
    });

    it('enforces maximum depth of 3 levels: rejects adding child to Level 3 goal', () => {
      const root = createTestGoal({ id: 'g-1', title: 'سطح ۱', hierarchyLevel: 1 });
      const seasonal = createTestGoal({ id: 'g-2', title: 'سطح ۲', hierarchyLevel: 2, parentId: 'g-1' });
      const monthly = createTestGoal({ id: 'g-3', title: 'سطح ۳', hierarchyLevel: 3, parentId: 'g-2' });

      const validation = GoalHierarchyService.validateParentAssignment(
        'g-4',
        'g-3',
        [root, seasonal, monthly]
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('حداکثر عمق سلسله‌مراتب اهداف ۳ سطح');
    });

    it('rejects assigning self as parent', () => {
      const goal = createTestGoal({ id: 'g-self', title: 'هدف', hierarchyLevel: 1 });
      const validation = GoalHierarchyService.validateParentAssignment('g-self', 'g-self', [goal]);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('نمی‌تواند والد خودش باشد');
    });

    it('rejects assigning an existing child/descendant as parent (cycle prevention)', () => {
      const parent = createTestGoal({ id: 'g-parent', title: 'والد', hierarchyLevel: 1 });
      const child = createTestGoal({
        id: 'g-child',
        title: 'فرزند',
        hierarchyLevel: 2,
        parentId: 'g-parent'
      });

      // تلاش برای والد کردن g-child برای g-parent
      const validation = GoalHierarchyService.validateParentAssignment(
        'g-parent',
        'g-child',
        [parent, child]
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('زیرمجموعه‌های هدف');
    });
  });

  describe('Weighted effective progress calculation', () => {
    it('calculates progress from own metric when goal has no children', () => {
      const leafGoal = createTestGoal({
        id: 'g-leaf',
        title: 'هدف مستقل',
        hierarchyLevel: 1,
        currentValue: 40,
        targetValue: 100
      });

      const progress = GoalHierarchyService.calculateEffectiveProgress(leafGoal, [leafGoal]);
      expect(progress).toBe(40);
    });

    it('calculates weighted average progress from direct children', () => {
      const parent = createTestGoal({
        id: 'parent',
        title: 'هدف والد',
        hierarchyLevel: 1,
        currentValue: 0,
        targetValue: 100
      });

      // Child 1: progress 100%, weight 1
      const child1 = createTestGoal({
        id: 'c1',
        title: 'فرزند اول',
        hierarchyLevel: 2,
        parentId: 'parent',
        weight: 1,
        currentValue: 100,
        targetValue: 100
      });

      // Child 2: progress 0%, weight 3
      const child2 = createTestGoal({
        id: 'c2',
        title: 'فرزند دوم',
        hierarchyLevel: 2,
        parentId: 'parent',
        weight: 3,
        currentValue: 0,
        targetValue: 100
      });

      // Weighted average: (100 * 1 + 0 * 3) / (1 + 3) = 100 / 4 = 25%
      const parentProgress = GoalHierarchyService.calculateEffectiveProgress(parent, [
        parent,
        child1,
        child2
      ]);

      expect(parentProgress).toBe(25);
    });

    it('recursively calculates progress across 3 levels', () => {
      // Level 1: Root
      const root = createTestGoal({ id: 'root', title: 'سالانه', hierarchyLevel: 1 });

      // Level 2: Seasonal (Child of Root, weight 2)
      const seasonal = createTestGoal({
        id: 'seasonal',
        title: 'فصلی',
        hierarchyLevel: 2,
        parentId: 'root',
        weight: 2
      });

      // Level 3: Monthly A (Child of Seasonal, progress 50%, weight 1)
      const monthlyA = createTestGoal({
        id: 'mA',
        title: 'ماهانه الف',
        hierarchyLevel: 3,
        parentId: 'seasonal',
        weight: 1,
        currentValue: 50,
        targetValue: 100
      });

      // Level 3: Monthly B (Child of Seasonal, progress 100%, weight 1)
      const monthlyB = createTestGoal({
        id: 'mB',
        title: 'ماهانه ب',
        hierarchyLevel: 3,
        parentId: 'seasonal',
        weight: 1,
        currentValue: 100,
        targetValue: 100
      });

      // Seasonal progress = (50*1 + 100*1) / 2 = 75%
      // Root progress = 75% (since it has only this child)
      const allGoals = [root, seasonal, monthlyA, monthlyB];
      expect(GoalHierarchyService.calculateEffectiveProgress(seasonal, allGoals)).toBe(75);
      expect(GoalHierarchyService.calculateEffectiveProgress(root, allGoals)).toBe(75);
    });
  });

  describe('Tree building', () => {
    it('builds recursive tree structure from flat goals array', () => {
      const root = createTestGoal({ id: 'r1', title: 'هدف ریشه ۱', hierarchyLevel: 1 });
      const c1 = createTestGoal({ id: 'c1', title: 'فرزند ریشه ۱', hierarchyLevel: 2, parentId: 'r1' });
      const c1_sub = createTestGoal({ id: 'c1_sub', title: 'نوه ریشه ۱', hierarchyLevel: 3, parentId: 'c1' });
      const independent = createTestGoal({ id: 'r2', title: 'هدف ریشه ۲', hierarchyLevel: 1 });

      const tree = GoalHierarchyService.buildTree([root, c1, c1_sub, independent]);

      expect(tree.length).toBe(2);
      expect(tree[0].goal.id).toBe('r1');
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].goal.id).toBe('c1');
      expect(tree[0].children[0].children.length).toBe(1);
      expect(tree[0].children[0].children[0].goal.id).toBe('c1_sub');

      expect(tree[1].goal.id).toBe('r2');
      expect(tree[1].children.length).toBe(0);
    });
  });
});
