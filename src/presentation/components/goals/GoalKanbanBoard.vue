<script setup lang="ts">
import { ref, computed } from 'vue';
import { Goal } from '@/domain/entities/Goal';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { useGoalStore } from '../../stores/useGoalStore';
import GoalKanbanColumn from './GoalKanbanColumn.vue';
import AppIcon from '../common/AppIcon.vue';

const goalStore = useGoalStore();

const draggedGoal = ref<Goal | null>(null);
const showAbandoned = ref(false);
const transitionError = ref('');

const draftGoals = computed(() => goalStore.filteredGoals.filter(g => g.status === 'draft'));
const scheduledGoals = computed(() => goalStore.filteredGoals.filter(g => g.status === 'scheduled'));
const activeGoals = computed(() => goalStore.filteredGoals.filter(g => g.status === 'active'));
const pausedGoals = computed(() => goalStore.filteredGoals.filter(g => g.status === 'paused'));
const completedGoals = computed(() => goalStore.filteredGoals.filter(g => g.status === 'completed'));
const abandonedGoals = computed(() => goalStore.filteredGoals.filter(g => g.status === 'abandoned'));

const onDragStart = (goal: Goal) => {
  draggedGoal.value = goal;
  transitionError.value = '';
};

const onDragEnd = () => {
  draggedGoal.value = null;
};

const handleTransition = async (payload: { goalId: string; targetStatus: GoalStatus }) => {
  transitionError.value = '';
  try {
    await goalStore.transitionStatus(payload.goalId, payload.targetStatus);
  } catch (err: any) {
    transitionError.value = err?.message || 'انتقال وضعیت هدف طبق قوانین ماشین وضعیت مجاز نیست.';
  } finally {
    draggedGoal.value = null;
  }
};
</script>

<template>
  <div class="kanban-board-wrapper">
    <!-- بنر نمایش خطا در صورت ممانعت قوانین ماشین وضعیت یا پیش‌نیازها -->
    <div v-if="transitionError" class="kanban-error-banner animate-slide-down">
      <AppIcon name="alert" size="18" />
      <span class="error-msg-text">{{ transitionError }}</span>
      <button
        type="button"
        class="dismiss-error-btn touch-target"
        aria-label="بستن خطا"
        @click="transitionError = ''"
      >
        <AppIcon name="x" size="14" />
      </button>
    </div>

    <!-- نوار راهنما و کنترل ستون‌های اضافی -->
    <div class="kanban-toolbar">
      <span class="kanban-guide-hint">
        <AppIcon name="info" size="14" />
        کارت‌ها را فقط بین وضعیت‌های مجاز ماشین وضعیت جابه‌جا کنید یا از دکمه منوی روی کارت استفاده نمایید.
      </span>

      <button
        type="button"
        :class="['toggle-abandoned-btn', { 'btn-active': showAbandoned }]"
        @click="showAbandoned = !showAbandoned"
      >
        {{ showAbandoned ? 'پنهان کردن ستون رهاشده' : 'نمایش ستون رهاشده' }}
      </button>
    </div>

    <!-- ستون‌های کانبان با اسکرول افقی واکنش‌گرا -->
    <div class="kanban-columns-track">
      <!-- ۱. پیش‌نویس -->
      <GoalKanbanColumn
        status="draft"
        title="پیش‌نویس"
        :goals="draftGoals"
        :dragged-goal="draggedGoal"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drop-goal="handleTransition"
        @transition-status="handleTransition"
      />

      <!-- ۲. برنامه‌ریزی‌شده -->
      <GoalKanbanColumn
        status="scheduled"
        title="برنامه‌ریزی‌شده"
        :goals="scheduledGoals"
        :dragged-goal="draggedGoal"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drop-goal="handleTransition"
        @transition-status="handleTransition"
      />

      <!-- ۳. فعال (در حال اقدام) -->
      <GoalKanbanColumn
        status="active"
        title="فعال (اقدام)"
        :goals="activeGoals"
        :dragged-goal="draggedGoal"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drop-goal="handleTransition"
        @transition-status="handleTransition"
      />

      <!-- ۴. متوقف موقت -->
      <GoalKanbanColumn
        status="paused"
        title="متوقف موقت"
        :goals="pausedGoals"
        :dragged-goal="draggedGoal"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drop-goal="handleTransition"
        @transition-status="handleTransition"
      />

      <!-- ۵. تکمیل‌شده -->
      <GoalKanbanColumn
        status="completed"
        title="تکمیل‌شده"
        :goals="completedGoals"
        :dragged-goal="draggedGoal"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drop-goal="handleTransition"
        @transition-status="handleTransition"
      />

      <!-- ۶. رهاشده (اختیاری) -->
      <GoalKanbanColumn
        v-if="showAbandoned"
        status="abandoned"
        title="رهاشده"
        :goals="abandonedGoals"
        :dragged-goal="draggedGoal"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drop-goal="handleTransition"
        @transition-status="handleTransition"
      />
    </div>
  </div>
</template>

<style scoped>
.kanban-board-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}

.kanban-error-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--color-danger-subtle);
  border: var(--border-width-hairline) solid var(--color-danger);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.error-msg-text {
  flex: 1;
  font-weight: 600;
}

.dismiss-error-btn {
  background: transparent;
  color: var(--color-danger);
  padding: 4px;
  border-radius: var(--radius-xs);
}

.kanban-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.kanban-guide-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.toggle-abandoned-btn {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.toggle-abandoned-btn:hover {
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
}

.toggle-abandoned-btn.btn-active {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.kanban-columns-track {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding-bottom: var(--spacing-md);
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.kanban-columns-track > * {
  scroll-snap-align: start;
}
</style>
