<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { Goal } from '@/domain/entities/Goal';
import { getGoalStatusLabel } from '@/domain/value-objects/GoalStatus';
import { getGoalPriorityLabel } from '@/domain/value-objects/GoalPriority';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppProgressBar from '../common/AppProgressBar.vue';
import AppIcon from '../common/AppIcon.vue';

const props = defineProps<{
  goal: Goal;
}>();

const goalStore = useGoalStore();
const { formatShortDate, localizeDigits, effectiveTodayIso } = usePersianCalendar();

const isOverdue = computed(() => props.goal.isOverdue(effectiveTodayIso.value));
const children = computed(() => goalStore.getGoalChildren(props.goal.id));
const hasChildren = computed(() => children.value.length > 0);
const effectiveProgress = computed(() => goalStore.getGoalEffectiveProgress(props.goal.id));

const statusClass = computed(() => `status-${props.goal.status}`);
const priorityClass = computed(() => `priority-${props.goal.priority}`);
const levelClass = computed(() => `level-${props.goal.hierarchyLevel}`);
</script>

<template>
  <RouterLink :to="`/goals/${goal.id}`" class="goal-card-link">
    <article :class="['goal-card', { 'card-overdue': isOverdue }]">
      <header class="goal-card-header">
        <div class="goal-meta-tags">
          <span :class="['meta-badge', levelClass]">
            {{ goal.hierarchyLevelLabel }}
          </span>
          <span :class="['meta-badge', priorityClass]">
            {{ getGoalPriorityLabel(goal.priority) }}
          </span>
          <span :class="['meta-badge', statusClass]">
            {{ getGoalStatusLabel(goal.status) }}
          </span>
          <span
            v-if="goal.blockedByGoalIds && goal.blockedByGoalIds.length > 0"
            class="lock-badge"
            title="دارای پیش‌نیاز"
          >
            <AppIcon name="lock" size="12" />
            {{ localizeDigits(goal.blockedByGoalIds.length) }}
          </span>
        </div>

        <span class="goal-deadline-text">
          <AppIcon name="calendar" size="14" />
          {{ formatShortDate(goal.deadline) }}
        </span>
      </header>

      <h3 class="goal-title">{{ goal.title }}</h3>
      <p class="goal-why-statement">
        <strong>چرا:</strong> {{ goal.whyStatement }}
      </p>

      <div class="goal-progress-section">
        <div class="progress-info-row">
          <span v-if="hasChildren" class="progress-metric-values">
            پیشرفت وزن‌دار ({{ localizeDigits(children.length) }} زیرمجموعه)
          </span>
          <span v-else class="progress-metric-values">
            {{ localizeDigits(goal.metric.currentValue) }} / {{ localizeDigits(goal.metric.targetValue) }} {{ goal.metric.unit }}
          </span>
          <span class="progress-percent">
            {{ localizeDigits(effectiveProgress) }}٪
          </span>
        </div>
        <AppProgressBar :percentage="effectiveProgress" :height="8" />
      </div>

      <footer class="goal-card-footer">
        <span class="duration-badge">
          مدت سپری‌شده: {{ localizeDigits(goal.durationInDays) }} روز
        </span>
        <span v-if="isOverdue" class="overdue-warning">
          مهلت گذشته!
        </span>
      </footer>
    </article>
  </RouterLink>
</template>

<style scoped>
.goal-card-link {
  display: block;
}

.goal-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.goal-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-strong);
  transform: translateY(-1px);
}

.card-overdue {
  border-color: var(--color-danger);
  background-color: var(--color-danger-subtle);
}

.goal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.goal-meta-tags {
  display: flex;
  gap: var(--spacing-xxs);
}

.meta-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.priority-high {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
}
.priority-medium {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}
.priority-low {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-secondary);
}

.level-1 {
  background-color: var(--color-info-subtle);
  color: var(--color-info);
}
.level-2 {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}
.level-3 {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-primary);
}

.lock-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}

.status-active {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}
.status-completed {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}
.status-paused {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}
.status-draft {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-muted);
}
.status-abandoned {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.goal-deadline-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.goal-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.goal-why-statement {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.goal-progress-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  margin-top: var(--spacing-xxs);
}

.progress-info-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.progress-percent {
  font-weight: 700;
  color: var(--color-text-primary);
}

.goal-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--spacing-xxs);
  font-size: 11px;
}

.duration-badge {
  color: var(--color-text-muted);
}

.overdue-warning {
  color: var(--color-danger);
  font-weight: 700;
}
</style>
