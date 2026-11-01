<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Goal } from '@/domain/entities/Goal';
import { GoalStatus, getGoalStatusLabel } from '@/domain/value-objects/GoalStatus';
import { GoalStateMachine } from '@/domain/state-machine/GoalStateMachine';
import { getGoalPriorityLabel } from '@/domain/value-objects/GoalPriority';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppProgressBar from '../common/AppProgressBar.vue';
import AppIcon from '../common/AppIcon.vue';

const props = defineProps<{
  goal: Goal;
}>();

const emit = defineEmits<{
  (e: 'drag-start', goal: Goal): void;
  (e: 'drag-end'): void;
  (e: 'transition-status', payload: { goalId: string; targetStatus: GoalStatus }): void;
}>();

const router = useRouter();
const goalStore = useGoalStore();
const { formatShortDate, localizeDigits } = usePersianCalendar();

const isMenuOpen = ref(false);

const effectiveProgress = computed(() => {
  return goalStore.getGoalEffectiveProgress(props.goal.id);
});

const allowedNextStatuses = computed(() => {
  return GoalStateMachine.getAllowedNextStatuses(props.goal.status);
});

const onDragStart = (e: DragEvent) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', props.goal.id);
  }
  emit('drag-start', props.goal);
};

const onDragEnd = () => {
  emit('drag-end');
};

const handleAccessibleTransition = (st: GoalStatus) => {
  isMenuOpen.value = false;
  emit('transition-status', { goalId: props.goal.id, targetStatus: st });
};

const navigateToDetail = () => {
  router.push(`/goals/${props.goal.id}`);
};
</script>

<template>
  <article
    class="kanban-card"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="navigateToDetail"
  >
    <!-- نوار بالای کارت -->
    <div class="card-top-row">
      <div class="card-badges-group">
        <span :class="['level-tag', `lvl-${goal.hierarchyLevel}`]">
          {{ goal.hierarchyLevelLabel }}
        </span>
        <span :class="['priority-tag', `prio-${goal.priority}`]">
          {{ getGoalPriorityLabel(goal.priority) }}
        </span>
        <span
          v-if="goal.blockedByGoalIds && goal.blockedByGoalIds.length > 0"
          class="lock-indicator-badge"
          title="دارای پیش‌نیاز"
        >
          <AppIcon name="lock" size="12" />
          {{ localizeDigits(goal.blockedByGoalIds.length) }}
        </span>
      </div>

      <!-- منوی دسترسی‌پذیر انتقال بدون کشیدن -->
      <div class="accessible-menu-container" @click.stop>
        <button
          type="button"
          class="accessible-menu-trigger-btn touch-target"
          :aria-expanded="isMenuOpen"
          title="منوی انتقال وضعیت"
          @click="isMenuOpen = !isMenuOpen"
        >
          <AppIcon name="settings" size="14" />
        </button>

        <div v-if="isMenuOpen" class="accessible-dropdown-menu">
          <span class="dropdown-header">انتقال مجاز به:</span>
          <button
            v-for="st in allowedNextStatuses"
            :key="st"
            type="button"
            class="dropdown-item-btn"
            @click="handleAccessibleTransition(st)"
          >
            {{ getGoalStatusLabel(st) }}
          </button>
          <span v-if="allowedNextStatuses.length === 0" class="no-transitions-hint">
            انتقال دیگری مجاز نیست
          </span>
        </div>
      </div>
    </div>

    <!-- عنوان هدف -->
    <h4 class="card-title">{{ goal.title }}</h4>

    <!-- نوار پیشرفت مؤثر -->
    <div class="card-progress-box">
      <div class="progress-info-row">
        <span class="progress-lbl">پیشرفت:</span>
        <span class="progress-pct">{{ localizeDigits(effectiveProgress) }}٪</span>
      </div>
      <AppProgressBar :percentage="effectiveProgress" :height="6" />
    </div>

    <!-- فوتر کارت: تاریخ مهلت -->
    <div class="card-footer-row">
      <span class="deadline-text">
        <AppIcon name="calendar" size="12" />
        {{ formatShortDate(goal.deadline) }}
      </span>

      <span v-if="goal.weight > 1" class="weight-badge">
        وزن: {{ localizeDigits(goal.weight) }}
      </span>
    </div>
  </article>
</template>

<style scoped>
.kanban-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  cursor: grab;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
  user-select: none;
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
}

.card-badges-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.level-tag, .priority-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.lvl-1 {
  background-color: var(--color-info-subtle);
  color: var(--color-info);
}
.lvl-2 {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}
.lvl-3 {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-primary);
}

.prio-high {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
}
.prio-medium {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}
.prio-low {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-muted);
}

.lock-indicator-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}

.accessible-menu-container {
  position: relative;
}

.accessible-menu-trigger-btn {
  background: transparent;
  color: var(--color-text-muted);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}

.accessible-menu-trigger-btn:hover {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-accent);
}

.accessible-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 4px;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-header {
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-muted);
  padding: 4px 6px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.dropdown-item-btn {
  text-align: right;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-xs);
  color: var(--color-text-primary);
  background: transparent;
  transition: all var(--transition-fast);
}

.dropdown-item-btn:hover {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.no-transitions-hint {
  font-size: 10px;
  color: var(--color-text-muted);
  padding: 4px 6px;
}

.card-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.card-progress-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-text-muted);
}

.progress-pct {
  font-weight: 700;
  color: var(--color-text-secondary);
}

.card-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-text-muted);
  padding-top: 2px;
}

.deadline-text {
  display: flex;
  align-items: center;
  gap: 3px;
}

.weight-badge {
  font-size: 10px;
  color: var(--color-text-secondary);
  background-color: var(--color-bg-surface-soft);
  padding: 1px 4px;
  border-radius: 2px;
}
</style>
