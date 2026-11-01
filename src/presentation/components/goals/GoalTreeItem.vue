<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { GoalTreeNode } from '@/domain/services/GoalHierarchyService';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppIcon from '../common/AppIcon.vue';
import AppProgressBar from '../common/AppProgressBar.vue';

const props = defineProps<{
  node: GoalTreeNode;
  depth?: number;
}>();

defineEmits<{
  (e: 'add-child', parentId: string): void;
}>();

const router = useRouter();
const { localizeDigits, formatShortDate } = usePersianCalendar();

const isExpanded = ref(true);
const currentDepth = props.depth ?? 1;

const hasChildren = props.node.children.length > 0;
const goal = props.node.goal;

const navigateToDetail = () => {
  router.push(`/goals/${goal.id}`);
};

const getLevelBadge = (level: number) => {
  switch (level) {
    case 1:
      return { label: 'سالانه (استراتژیک)', class: 'level-1' };
    case 2:
      return { label: 'فصلی (مرحله‌ای)', class: 'level-2' };
    case 3:
      return { label: 'ماهانه (تاکتیکی)', class: 'level-3' };
    default:
      return { label: `سطح ${level}`, class: 'level-1' };
  }
};
</script>

<template>
  <div :class="['goal-tree-item', `depth-${currentDepth}`]">
    <div class="tree-node-content">
      <!-- دکمه باز/بسته کردن شاخه اگر دارای فرزند باشد -->
      <button
        v-if="hasChildren"
        type="button"
        class="toggle-expand-btn touch-target"
        :aria-label="isExpanded ? 'بستن شاخه' : 'باز کردن شاخه'"
        @click="isExpanded = !isExpanded"
      >
        <AppIcon :name="isExpanded ? 'chevron-down' : 'chevron-left'" size="16" />
      </button>
      <span v-else class="tree-bullet-placeholder" />

      <!-- محتوای اصلی ردیف هدف -->
      <div class="tree-node-card" @click="navigateToDetail">
        <div class="node-header">
          <div class="node-title-group">
            <span :class="['level-badge', getLevelBadge(goal.hierarchyLevel).class]">
              {{ getLevelBadge(goal.hierarchyLevel).label }}
            </span>
            <strong class="goal-title">{{ goal.title }}</strong>
            <span v-if="goal.weight && goal.weight > 1" class="weight-tag" title="وزن در هدف والد">
              وزن: {{ localizeDigits(goal.weight) }}
            </span>
          </div>

          <div class="node-status-group">
            <span v-if="goal.blockedByGoalIds && goal.blockedByGoalIds.length > 0" class="lock-indicator" title="دارای پیش‌نیاز">
              <AppIcon name="lock" size="14" class="text-warning" />
              <span class="lock-count">{{ localizeDigits(goal.blockedByGoalIds.length) }} پیش‌نیاز</span>
            </span>

            <span :class="['status-badge', `status-${goal.status}`]">
              {{ goal.status === 'active' ? 'فعال' : goal.status === 'completed' ? 'تکمیل‌شده' : goal.status === 'paused' ? 'متوقف' : goal.status === 'scheduled' ? 'زمان‌بندی' : 'پیش‌نویس' }}
            </span>
          </div>
        </div>

        <!-- نوار پیشرفت مؤثر -->
        <div class="node-progress-strip">
          <div class="progress-labels">
            <span class="progress-source-lbl">
              {{ hasChildren ? 'پیشرفت وزن‌دار زیرمجموعه‌ها:' : 'پیشرفت سنجه:' }}
            </span>
            <span class="progress-val">{{ localizeDigits(node.effectiveProgress) }}٪</span>
          </div>
          <AppProgressBar :percentage="node.effectiveProgress" />
        </div>

        <!-- اطلاعات فوتر ردیف -->
        <div class="node-footer">
          <span class="deadline-text">
            مهلت: {{ formatShortDate(goal.deadline) }}
          </span>

          <div class="node-actions" @click.stop>
            <button
              v-if="goal.canHaveChildren"
              type="button"
              class="add-subgoal-btn touch-target"
              @click="$emit('add-child', goal.id)"
            >
              <AppIcon name="plus" size="14" />
              <span>افزودن فرزند (سطح {{ localizeDigits(goal.hierarchyLevel + 1) }})</span>
            </button>

            <button type="button" class="view-detail-btn touch-target" @click="navigateToDetail">
              <span>جزئیات</span>
              <AppIcon name="chevron-left" size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- رندر بازگشتی اهداف فرزند در صورت باز بودن شاخه -->
    <div v-if="hasChildren && isExpanded" class="tree-children-container animate-slide-up">
      <GoalTreeItem
        v-for="child in node.children"
        :key="child.goal.id"
        :node="child"
        :depth="currentDepth + 1"
        @add-child="$emit('add-child', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.goal-tree-item {
  display: flex;
  flex-direction: column;
  position: relative;
  margin-bottom: var(--spacing-xs);
}

.tree-node-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
}

.toggle-expand-btn {
  background: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 6px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.tree-bullet-placeholder {
  width: 28px;
  height: 28px;
  display: inline-block;
  flex-shrink: 0;
}

.tree-node-card {
  flex: 1;
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.tree-node-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.node-title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.level-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.level-1 {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.level-2 {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-subtle);
}

.level-3 {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-muted);
}

.goal-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.weight-tag {
  font-size: 10px;
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-secondary);
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
}

.node-status-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.lock-indicator {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--color-warning);
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
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

.status-scheduled {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-muted);
}

.status-draft {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-muted);
}

.node-progress-strip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--spacing-xs);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.progress-source-lbl {
  color: var(--color-text-muted);
}

.progress-val {
  font-weight: 700;
  color: var(--color-accent);
}

.node-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  font-size: 11px;
}

.deadline-text {
  color: var(--color-text-muted);
}

.node-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.add-subgoal-btn {
  background: transparent;
  border: 1px dashed var(--color-accent);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  padding: 3px 6px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
}

.add-subgoal-btn:hover {
  background: var(--color-accent-subtle);
}

.view-detail-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

.view-detail-btn:hover {
  color: var(--color-accent);
}

/* ایندنت و استایل شاخه‌های فرزند */
.tree-children-container {
  margin-right: 28px;
  border-right: 2px solid var(--color-border-subtle);
  padding-right: var(--spacing-xs);
  margin-top: 4px;
}

.depth-2 {
  border-color: var(--color-border-subtle);
}

.depth-3 {
  opacity: 0.95;
}
</style>
