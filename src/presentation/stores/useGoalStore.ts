import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Goal, type GoalHierarchyLevel } from '@/domain/entities/Goal';
import { Milestone } from '@/domain/entities/Milestone';
import { ActionLog } from '@/domain/entities/ActionLog';
import { ObstacleLog } from '@/domain/entities/ObstacleLog';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { container } from '@/infrastructure/di/container';
import { CreateGoalUseCase, CreateGoalInput } from '@/application/use-cases/goals/CreateGoalUseCase';
import { UpdateGoalUseCase, UpdateGoalInput } from '@/application/use-cases/goals/UpdateGoalUseCase';
import { TransitionGoalStatusUseCase } from '@/application/use-cases/goals/TransitionGoalStatusUseCase';
import { LogActionUseCase, LogActionInput } from '@/application/use-cases/goals/LogActionUseCase';
import { UpdateActionLogUseCase, UpdateActionLogInput } from '@/application/use-cases/goals/UpdateActionLogUseCase';
import { DeleteActionLogUseCase } from '@/application/use-cases/goals/DeleteActionLogUseCase';
import { RecordObstacleUseCase, RecordObstacleInput } from '@/application/use-cases/goals/RecordObstacleUseCase';
import { UpdateObstacleLogUseCase, UpdateObstacleLogInput } from '@/application/use-cases/goals/UpdateObstacleLogUseCase';
import { DeleteObstacleLogUseCase } from '@/application/use-cases/goals/DeleteObstacleLogUseCase';
import { DuplicateGoalUseCase } from '@/application/use-cases/goals/DuplicateGoalUseCase';
import { GoalHierarchyService, type GoalTreeNode } from '@/domain/services/GoalHierarchyService';
import { GoalDependencyService } from '@/domain/services/GoalDependencyService';

export interface SmartAlert {
  readonly id: string;
  readonly type: 'warning' | 'info' | 'danger';
  readonly title: string;
  readonly message: string;
  readonly goalId?: string;
}

export const useGoalStore = defineStore('goals', () => {
  const goals = ref<readonly Goal[]>([]);
  const currentGoalMilestones = ref<readonly Milestone[]>([]);
  const currentGoalActionLogs = ref<readonly ActionLog[]>([]);
  const currentGoalObstacleLogs = ref<readonly ObstacleLog[]>([]);
  const isLoading = ref(false);
  const statusFilter = ref<GoalStatus | 'all'>('all');
  const searchQuery = ref('');

  const createGoalUseCase = new CreateGoalUseCase(container.goalRepo);
  const updateGoalUseCase = new UpdateGoalUseCase(container.goalRepo);
  const transitionStatusUseCase = new TransitionGoalStatusUseCase(container.goalRepo);
  const logActionUseCase = new LogActionUseCase(container.goalRepo);
  const updateActionLogUseCase = new UpdateActionLogUseCase(container.goalRepo);
  const deleteActionLogUseCase = new DeleteActionLogUseCase(container.goalRepo);
  const recordObstacleUseCase = new RecordObstacleUseCase(container.goalRepo);
  const updateObstacleLogUseCase = new UpdateObstacleLogUseCase(container.goalRepo);
  const deleteObstacleLogUseCase = new DeleteObstacleLogUseCase(container.goalRepo);
  const duplicateGoalUseCase = new DuplicateGoalUseCase(container.goalRepo);

  const loadGoals = async (includeArchived = false) => {
    isLoading.value = true;
    try {
      goals.value = await container.goalRepo.findAll(includeArchived);
    } finally {
      isLoading.value = false;
    }
  };

  const filteredGoals = computed(() => {
    return goals.value.filter(g => {
      if (statusFilter.value !== 'all' && g.status !== statusFilter.value) {
        return false;
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.trim().toLowerCase();
        return g.title.toLowerCase().includes(q) || g.whyStatement.toLowerCase().includes(q);
      }
      return true;
    });
  });

  const activeGoalsCount = computed(() => {
    return goals.value.filter(g => g.status === 'active').length;
  });

  /**
   * ساختار درختی اهداف فعال (سلسله‌مراتب سالانه ← فصلی ← ماهانه)
   */
  const goalTree = computed<readonly GoalTreeNode[]>(() => {
    return GoalHierarchyService.buildTree(goals.value);
  });

  /**
   * هشدارهای هوشمند سیستم
   */
  const smartAlerts = computed<readonly SmartAlert[]>(() => {
    const alerts: SmartAlert[] = [];
    const today = new Date().toISOString().slice(0, 10);

    // ۱) تعداد زیاد اهداف فعال
    if (activeGoalsCount.value > 3) {
      alerts.push({
        id: 'too-many-active',
        type: 'warning',
        title: 'تعدد اهداف فعال',
        message: `شما ${activeGoalsCount.value} هدف هم‌زمان فعال دارید. پیشنهاد می‌شود برای حفظ تمرکز، حداکثر ۳ هدف را هم‌زمان پیش ببرید.`
      });
    }

    // ۲) اهداف مسدود یا معوق
    for (const goal of goals.value) {
      if (goal.isOverdue(today)) {
        alerts.push({
          id: `overdue-${goal.id}`,
          type: 'danger',
          title: `مهلت گذشته: ${goal.title}`,
          message: `مهلت رسیدن به هدف به پایان رسیده است. وضعیت آن را بازبینی کنید یا مهلت را به‌روزرسانی نمایید.`,
          goalId: goal.id
        });
      }

      // هشدار اهداف مسدودشده توسط پیش‌نیازها
      if (goal.status === 'scheduled' || goal.status === 'draft') {
        const prereqCheck = GoalDependencyService.checkPrerequisites(goal, goals.value);
        if (prereqCheck.isBlocked) {
          alerts.push({
            id: `blocked-${goal.id}`,
            type: 'info',
            title: `هدف مسدود: ${goal.title}`,
            message: `این هدف منتظر تکمیل ${prereqCheck.uncompletedPrerequisites.length} هدف پیش‌نیاز است.`,
            goalId: goal.id
          });
        }
      }
    }

    return alerts;
  });

  const loadGoalDetails = async (goalId: string) => {
    const [milestones, actions, obstacles] = await Promise.all([
      container.goalRepo.findMilestonesByGoalId(goalId),
      container.goalRepo.findActionLogsByGoalId(goalId),
      container.goalRepo.findObstacleLogsByGoalId(goalId)
    ]);
    currentGoalMilestones.value = milestones;
    currentGoalActionLogs.value = actions;
    currentGoalObstacleLogs.value = obstacles;
  };

  const createGoal = async (input: CreateGoalInput) => {
    const created = await createGoalUseCase.execute(input);
    await loadGoals();
    return created;
  };

  const updateGoal = async (input: UpdateGoalInput) => {
    const updated = await updateGoalUseCase.execute(input);
    await loadGoals();
    await loadGoalDetails(input.id);
    return updated;
  };

  const transitionStatus = async (goalId: string, status: GoalStatus) => {
    await transitionStatusUseCase.execute(goalId, status);
    await loadGoals();
  };

  /**
   * محاسبه پیشرفت مؤثر یک هدف (مستقل یا وزن‌دار از فرزندان)
   */
  const getGoalEffectiveProgress = (goalId: string): number => {
    const goal = goals.value.find(g => g.id === goalId);
    if (!goal) return 0;
    return GoalHierarchyService.calculateEffectiveProgress(goal, goals.value);
  };

  /**
   * دریافت فرزندان مستقیم یک هدف
   */
  const getGoalChildren = (goalId: string): readonly Goal[] => {
    return goals.value.filter(g => g.parentId === goalId && !g.isArchived);
  };

  /**
   * دریافت هدف والد
   */
  const getGoalParent = (goalId: string): Goal | undefined => {
    const goal = goals.value.find(g => g.id === goalId);
    if (!goal || !goal.parentId) return undefined;
    return goals.value.find(g => g.id === goal.parentId);
  };

  /**
   * به‌روزرسانی پیش‌نیازها با تشخیص دور
   */
  const updateGoalDependencies = async (goalId: string, blockedByGoalIds: string[]) => {
    const goal = goals.value.find(g => g.id === goalId);
    if (!goal) return;

    GoalDependencyService.validateNoCycle(goalId, blockedByGoalIds, goals.value);

    const updated = goal.withDependencies(blockedByGoalIds, new Date().toISOString());
    await container.goalRepo.save(updated);
    await loadGoals();
    return updated;
  };

  /**
   * به‌روزرسانی سلسله‌مراتب و والد هدف با کنترل سقف عمق ۳ سطح
   */
  const updateGoalHierarchy = async (params: {
    goalId: string;
    parentId?: string;
    weight?: number;
  }) => {
    const goal = goals.value.find(g => g.id === params.goalId);
    if (!goal) return;

    const validation = GoalHierarchyService.validateParentAssignment(
      params.goalId,
      params.parentId,
      goals.value
    );

    if (!validation.isValid) {
      throw new Error(validation.error || 'انتساب والد نامعتبر است.');
    }

    const updated = goal.withHierarchy(
      {
        parentId: params.parentId,
        hierarchyLevel: validation.hierarchyLevel as GoalHierarchyLevel,
        weight: params.weight !== undefined ? params.weight : goal.weight
      },
      new Date().toISOString()
    );

    await container.goalRepo.save(updated);
    await loadGoals();
    return updated;
  };

  const logAction = async (input: LogActionInput) => {
    const action = await logActionUseCase.execute(input);
    await loadGoalDetails(input.goalId);
    await loadGoals();
    return action;
  };

  const updateActionLog = async (input: UpdateActionLogInput) => {
    const action = await updateActionLogUseCase.execute(input);
    await loadGoalDetails(input.goalId);
    await loadGoals();
    return action;
  };

  const deleteActionLog = async (actionLogId: string, goalId: string) => {
    await deleteActionLogUseCase.execute({ id: actionLogId, goalId });
    await loadGoalDetails(goalId);
    await loadGoals();
  };

  const recordObstacle = async (input: RecordObstacleInput) => {
    const obs = await recordObstacleUseCase.execute(input);
    await loadGoalDetails(input.goalId);
    return obs;
  };

  const updateObstacleLog = async (input: UpdateObstacleLogInput) => {
    const obs = await updateObstacleLogUseCase.execute(input);
    await loadGoalDetails(input.goalId);
    return obs;
  };

  const deleteObstacleLog = async (obstacleLogId: string, goalId: string) => {
    await deleteObstacleLogUseCase.execute({ id: obstacleLogId, goalId });
    await loadGoalDetails(goalId);
  };

  const duplicateGoal = async (goalId: string) => {
    const dup = await duplicateGoalUseCase.execute(goalId);
    await loadGoals();
    return dup;
  };

  const deleteGoal = async (goalId: string) => {
    await container.goalRepo.delete(goalId);
    await loadGoals();
  };

  const toggleMilestone = async (milestone: Milestone) => {
    const updated = milestone.toggleCompleted();
    await container.goalRepo.saveMilestone(updated);
    await loadGoalDetails(milestone.goalId);
  };

  const addMilestone = async (milestone: Milestone) => {
    await container.goalRepo.saveMilestone(milestone);
    await loadGoalDetails(milestone.goalId);
  };

  return {
    goals,
    filteredGoals,
    goalTree,
    currentGoalMilestones,
    currentGoalActionLogs,
    currentGoalObstacleLogs,
    isLoading,
    statusFilter,
    searchQuery,
    smartAlerts,
    activeGoalsCount,
    loadGoals,
    loadGoalDetails,
    createGoal,
    updateGoal,
    transitionStatus,
    getGoalEffectiveProgress,
    getGoalChildren,
    getGoalParent,
    updateGoalDependencies,
    updateGoalHierarchy,
    logAction,
    updateActionLog,
    deleteActionLog,
    recordObstacle,
    updateObstacleLog,
    deleteObstacleLog,
    duplicateGoal,
    deleteGoal,
    toggleMilestone,
    addMilestone
  };
});
