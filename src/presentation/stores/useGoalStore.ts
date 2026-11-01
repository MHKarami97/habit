import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Goal } from '@/domain/entities/Goal';
import { Milestone } from '@/domain/entities/Milestone';
import { ActionLog } from '@/domain/entities/ActionLog';
import { ObstacleLog } from '@/domain/entities/ObstacleLog';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { container } from '@/infrastructure/di/container';
import { CreateGoalUseCase, CreateGoalInput } from '@/application/use-cases/goals/CreateGoalUseCase';
import { TransitionGoalStatusUseCase } from '@/application/use-cases/goals/TransitionGoalStatusUseCase';
import { LogActionUseCase, LogActionInput } from '@/application/use-cases/goals/LogActionUseCase';
import { RecordObstacleUseCase, RecordObstacleInput } from '@/application/use-cases/goals/RecordObstacleUseCase';
import { DuplicateGoalUseCase } from '@/application/use-cases/goals/DuplicateGoalUseCase';

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
  const transitionStatusUseCase = new TransitionGoalStatusUseCase(container.goalRepo);
  const logActionUseCase = new LogActionUseCase(container.goalRepo);
  const recordObstacleUseCase = new RecordObstacleUseCase(container.goalRepo);
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
   * تولید هشدارهای هوشمند سیستم:
   * ۱) بیش از ۳ هدف فعال همزمان (توصیه تمرکز و پرهیز از چندپارگی)
   * ۲) اهداف گذشته از مهلت (Overdue)
   * ۳) اهداف فعال بدون اقدام در ۱۴ روز گذشته (راکد / Stale)
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

    // ۲ و ۳) بررسی تک‌تک اهداف
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

  const transitionStatus = async (goalId: string, status: GoalStatus) => {
    await transitionStatusUseCase.execute(goalId, status);
    await loadGoals();
  };

  const logAction = async (input: LogActionInput) => {
    const action = await logActionUseCase.execute(input);
    await loadGoalDetails(input.goalId);
    await loadGoals();
    return action;
  };

  const recordObstacle = async (input: RecordObstacleInput) => {
    const obs = await recordObstacleUseCase.execute(input);
    await loadGoalDetails(input.goalId);
    return obs;
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
    transitionStatus,
    logAction,
    recordObstacle,
    duplicateGoal,
    deleteGoal,
    toggleMilestone,
    addMilestone
  };
});
