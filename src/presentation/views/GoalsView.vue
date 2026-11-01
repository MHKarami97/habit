<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGoalStore } from '../stores/useGoalStore';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import GoalCard from '../components/goals/GoalCard.vue';
import GoalTreeItem from '../components/goals/GoalTreeItem.vue';
import GoalKanbanBoard from '../components/goals/GoalKanbanBoard.vue';
import GoalFormModal from '../components/goals/GoalFormModal.vue';
import AppEmptyState from '../components/common/AppEmptyState.vue';
import AppButton from '../components/common/AppButton.vue';
import AppIcon from '../components/common/AppIcon.vue';
import { useVirtualWindow } from '../composables/useVirtualWindow';
import { usePersianCalendar } from '../composables/usePersianCalendar';

const goalStore = useGoalStore();
const { localizeDigits } = usePersianCalendar();
const isCreateModalOpen = ref(false);
const selectedParentId = ref<string | undefined>(undefined);
const viewMode = ref<'grid' | 'tree' | 'kanban'>('grid');
const sortBy = ref<'deadline' | 'priority' | 'progress'>('deadline');
const isDismissedAlerts = ref<Record<string, boolean>>({});

const openAddChildModal = (parentId: string) => {
  selectedParentId.value = parentId;
  isCreateModalOpen.value = true;
};

const openCreateRootModal = () => {
  selectedParentId.value = undefined;
  isCreateModalOpen.value = true;
};

onMounted(async () => {
  await goalStore.loadGoals();
});

const filterTabs: readonly { key: GoalStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'active', label: 'فعال' },
  { key: 'scheduled', label: 'برنامه‌ریزی‌شده' },
  { key: 'paused', label: 'متوقف' },
  { key: 'completed', label: 'تکمیل‌شده' },
  { key: 'draft', label: 'پیش‌نویس' }
];

const sortedAndFilteredGoals = computed(() => {
  const list = [...goalStore.filteredGoals];
  if (sortBy.value === 'deadline') {
    list.sort((a, b) => a.deadline.localeCompare(b.deadline));
  } else if (sortBy.value === 'priority') {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    list.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  } else if (sortBy.value === 'progress') {
    list.sort((a, b) => b.metric.progressPercentage - a.metric.progressPercentage);
  }
  return list;
});

const {
  visibleItems: visibleGoals,
  hasMore: hasMoreGoals,
  loadMore: loadMoreGoals,
  totalCount: totalGoalsCount
} = useVirtualWindow(sortedAndFilteredGoals, { pageSize: 24 });

const visibleSmartAlerts = computed(() => {
  return goalStore.smartAlerts.filter(a => !isDismissedAlerts.value[a.id]);
});

const dismissAlert = (id: string) => {
  isDismissedAlerts.value = {
    ...isDismissedAlerts.value,
    [id]: true
  };
};
</script>

<template>
  <div class="goals-view-container">
    <!-- هشدارهای هوشمند (Smart Alerts) -->
    <div v-if="visibleSmartAlerts.length > 0" class="alerts-container">
      <div
        v-for="alert in visibleSmartAlerts"
        :key="alert.id"
        :class="['alert-card', `alert-${alert.type}`]"
      >
        <div class="alert-icon-wrap">
          <AppIcon :name="alert.type === 'danger' ? 'alert' : 'info'" size="18" />
        </div>
        <div class="alert-content">
          <strong class="alert-title">{{ alert.title }}</strong>
          <p class="alert-msg">{{ alert.message }}</p>
        </div>
        <button
          type="button"
          class="alert-dismiss-btn touch-target"
          aria-label="بستن هشدار"
          @click="dismissAlert(alert.id)"
        >
          <AppIcon name="x" size="14" />
        </button>
      </div>
    </div>

    <!-- نوار جستجو و دکمه ایجاد -->
    <div class="actions-bar">
      <div class="search-input-wrapper">
        <AppIcon name="target" size="18" class="search-icon" />
        <input
          v-model="goalStore.searchQuery"
          type="search"
          placeholder="جستجو در عنوان یا چرایی اهداف..."
          class="search-input"
        />
      </div>

      <div class="actions-right-group">
        <!-- دکمه تغییر حالت نما: کارتی یا درختی -->
        <div class="view-mode-toggle">
          <button
            type="button"
            :class="['view-toggle-btn', { 'view-toggle-active': viewMode === 'grid' }]"
            title="نمای کارتی"
            @click="viewMode = 'grid'"
          >
            نمای کارتی
          </button>
          <button
            type="button"
            :class="['view-toggle-btn', { 'view-toggle-active': viewMode === 'tree' }]"
            title="نمای درختی (سلسله‌مراتب)"
            @click="viewMode = 'tree'"
          >
            نمای درختی
          </button>
          <button
            type="button"
            :class="['view-toggle-btn', { 'view-toggle-active': viewMode === 'kanban' }]"
            title="نمای کانبان (تخته وضعیت‌ها)"
            @click="viewMode = 'kanban'"
          >
            نمای کانبان
          </button>
        </div>

        <AppButton variant="primary" size="md" @click="openCreateRootModal">
          <AppIcon name="plus" size="18" />
          هدف جدید
        </AppButton>
      </div>
    </div>

    <!-- نمای کارتی سنتی همراه با فیلترها و مرتب‌سازی -->
    <template v-if="viewMode === 'grid'">
      <!-- فیلتر و مرتب‌سازی -->
      <div class="controls-row">
        <!-- تب‌های فیلتر وضعیت -->
        <div class="filter-tabs-row">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            type="button"
            :class="['filter-tab-pill', { 'pill-active': goalStore.statusFilter === tab.key }]"
            @click="goalStore.statusFilter = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- انتخاب‌گر مرتب‌سازی -->
        <div class="sort-selector-wrapper">
          <label class="sort-label">مرتب‌سازی:</label>
          <select v-model="sortBy" class="sort-select">
            <option value="deadline">مهلت پایانی</option>
            <option value="priority">اولویت</option>
            <option value="progress">درصد پیشرفت</option>
          </select>
        </div>
      </div>

      <!-- لیست اهداف فیلترشده با رندر بهینه و پنجره مجازی -->
      <div v-if="visibleGoals.length > 0" class="goals-list-grid">
        <GoalCard
          v-for="goal in visibleGoals"
          :key="goal.id"
          :goal="goal"
        />
      </div>

      <!-- دکمه بارگذاری موارد بیشتر برای بارهای سنگین -->
      <div v-if="hasMoreGoals" class="load-more-row">
        <AppButton variant="secondary" size="sm" @click="loadMoreGoals">
          نمایش موارد بیشتر (نمایش {{ localizeDigits(visibleGoals.length) }} از {{ localizeDigits(totalGoalsCount) }})
        </AppButton>
      </div>

      <!-- حالت خالی -->
      <AppEmptyState
        v-else
        title="هدفی با این مشخصات یافت نشد"
        description="می‌توانید فیلتر وضعیت را تغییر دهید یا یک هدف جدید تعریف نمایید."
      >
        <template #action>
          <AppButton variant="primary" size="md" @click="openCreateRootModal">
            تعریف هدف جدید
          </AppButton>
        </template>
      </AppEmptyState>
    </template>

    <!-- نمای درختی سلسله‌مراتب اهداف (سالانه ← فصلی ← ماهانه) -->
    <template v-else-if="viewMode === 'tree'">
      <div v-if="goalStore.goalTree.length > 0" class="goals-tree-view">
        <GoalTreeItem
          v-for="rootNode in goalStore.goalTree"
          :key="rootNode.goal.id"
          :node="rootNode"
          @add-child="openAddChildModal"
        />
      </div>

      <AppEmptyState
        v-else
        title="ساختار درختی اهداف خالی است"
        description="اهداف خود را به صورت سلسله‌مراتب (سالانه، فصلی، ماهانه) سازماندهی کنید."
      >
        <template #action>
          <AppButton variant="primary" size="md" @click="openCreateRootModal">
            تعریف هدف جدید
          </AppButton>
        </template>
      </AppEmptyState>
    </template>

    <!-- نمای کانبان بر اساس وضعیت هدف (تخته وضعیت‌ها) -->
    <template v-else-if="viewMode === 'kanban'">
      <GoalKanbanBoard />
    </template>

    <GoalFormModal
      :is-open="isCreateModalOpen"
      :initial-parent-id="selectedParentId"
      @close="isCreateModalOpen = false"
    />
  </div>
</template>

<style scoped>
.goals-view-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-xl);
}

.alerts-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.alert-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: var(--border-width-hairline) solid transparent;
  animation: slideDown var(--transition-normal);
}

.alert-warning {
  background-color: var(--color-warning-subtle);
  border-color: var(--color-warning);
  color: var(--color-text-primary);
}
.alert-warning .alert-icon-wrap {
  color: var(--color-warning);
}

.alert-danger {
  background-color: var(--color-danger-subtle);
  border-color: var(--color-danger);
  color: var(--color-text-primary);
}
.alert-danger .alert-icon-wrap {
  color: var(--color-danger);
}

.alert-icon-wrap {
  display: flex;
  align-items: center;
  padding-top: 2px;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.alert-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.alert-msg {
  font-size: var(--font-size-xs);
  line-height: 1.4;
  color: var(--color-text-secondary);
}

.alert-dismiss-btn {
  background: transparent;
  color: var(--color-text-muted);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}
.alert-dismiss-btn:hover {
  color: var(--color-text-primary);
  background-color: rgba(0, 0, 0, 0.05);
}

.actions-bar {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

.actions-right-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.view-mode-toggle {
  display: flex;
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.view-toggle-btn {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
}

.view-toggle-active {
  background-color: var(--color-bg-surface);
  color: var(--color-accent);
  box-shadow: var(--shadow-xs);
  font-weight: 700;
}

.goals-tree-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  right: var(--spacing-sm);
  color: var(--color-text-muted);
}

.search-input {
  width: 100%;
  min-height: var(--touch-target-min);
  padding: 0 var(--spacing-lg) 0 var(--spacing-md);
  padding-right: 38px;
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}
.search-input:focus {
  border-color: var(--color-accent);
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.filter-tabs-row {
  display: flex;
  gap: var(--spacing-xxs);
  overflow-x: auto;
  padding-bottom: 4px;
}

.filter-tab-pill {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.filter-tab-pill.pill-active {
  background-color: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
}

.sort-selector-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxs);
}

.sort-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.sort-select {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  background-color: var(--color-bg-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.goals-list-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

@media (min-width: 640px) {
  .goals-list-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.load-more-row {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-md);
}
</style>
