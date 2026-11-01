<script setup lang="ts">
import { ref, computed } from 'vue';
import { Goal } from '@/domain/entities/Goal';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { GoalStateMachine } from '@/domain/state-machine/GoalStateMachine';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import GoalKanbanCard from './GoalKanbanCard.vue';

const props = defineProps<{
  status: GoalStatus;
  title: string;
  goals: readonly Goal[];
  draggedGoal: Goal | null;
}>();

const emit = defineEmits<{
  (e: 'drop-goal', payload: { goalId: string; targetStatus: GoalStatus }): void;
  (e: 'drag-start', goal: Goal): void;
  (e: 'drag-end'): void;
  (e: 'transition-status', payload: { goalId: string; targetStatus: GoalStatus }): void;
}>();

const { localizeDigits } = usePersianCalendar();
const isDragOver = ref(false);

const isValidDropTarget = computed(() => {
  if (!props.draggedGoal) return false;
  if (props.draggedGoal.status === props.status) return false;
  return GoalStateMachine.canTransition(props.draggedGoal.status, props.status);
});

const onDragOver = (e: DragEvent) => {
  if (isValidDropTarget.value) {
    e.preventDefault();
    isDragOver.value = true;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  } else {
    isDragOver.value = false;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'none';
    }
  }
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = false;
  if (isValidDropTarget.value && props.draggedGoal) {
    emit('drop-goal', {
      goalId: props.draggedGoal.id,
      targetStatus: props.status
    });
  }
};
</script>

<template>
  <div
    :class="[
      'kanban-column',
      `col-${status}`,
      {
        'drop-target-active': isDragOver && isValidDropTarget,
        'drop-target-forbidden': draggedGoal && !isValidDropTarget && draggedGoal.status !== status
      }
    ]"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- هدر ستون -->
    <header class="column-header">
      <div class="column-title-group">
        <span class="column-status-indicator" />
        <h3 class="column-title">{{ title }}</h3>
      </div>
      <span class="column-count-badge">
        {{ localizeDigits(goals.length) }}
      </span>
    </header>

    <!-- لیست کارت‌های این وضعیت -->
    <div class="column-cards-container">
      <GoalKanbanCard
        v-for="goal in goals"
        :key="goal.id"
        :goal="goal"
        @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end')"
        @transition-status="$emit('transition-status', $event)"
      />

      <div v-if="goals.length === 0" class="empty-column-placeholder">
        <span v-if="isDragOver && isValidDropTarget" class="drop-hint-text">
          اینجا رها کنید
        </span>
        <span v-else class="empty-text">خالی</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-column {
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 260px;
  max-width: 300px;
  flex: 1;
  transition: all var(--transition-fast);
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--spacing-xxs);
  border-bottom: 2px solid transparent;
}

.column-title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.column-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
}

.col-draft .column-status-indicator { background-color: var(--color-text-muted); }
.col-scheduled .column-status-indicator { background-color: var(--color-accent); }
.col-active .column-status-indicator { background-color: var(--color-info); }
.col-paused .column-status-indicator { background-color: var(--color-warning); }
.col-completed .column-status-indicator { background-color: var(--color-success); }
.col-abandoned .column-status-indicator { background-color: var(--color-danger); }

.column-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
}

.column-count-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface);
  color: var(--color-text-secondary);
}

.column-cards-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-height: 200px;
  flex: 1;
}

.empty-column-placeholder {
  flex: 1;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.drop-target-active {
  border-color: var(--color-accent);
  background-color: var(--color-accent-subtle);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.drop-target-forbidden {
  opacity: 0.5;
  filter: grayscale(40%);
}

.drop-hint-text {
  font-weight: 700;
  color: var(--color-accent);
}
</style>
