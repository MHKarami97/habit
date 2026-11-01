<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGoalStore } from '../stores/useGoalStore';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import GoalCard from '../components/goals/GoalCard.vue';
import GoalFormModal from '../components/goals/GoalFormModal.vue';
import AppEmptyState from '../components/common/AppEmptyState.vue';
import AppButton from '../components/common/AppButton.vue';
import AppIcon from '../components/common/AppIcon.vue';

const goalStore = useGoalStore();
const isCreateModalOpen = ref(false);

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
</script>

<template>
  <div class="goals-view-container">
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

      <AppButton variant="primary" size="md" @click="isCreateModalOpen = true">
        <AppIcon name="plus" size="18" />
        هدف جدید
      </AppButton>
    </div>

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

    <!-- لیست اهداف فیلترشده -->
    <div v-if="goalStore.filteredGoals.length > 0" class="goals-list-grid">
      <GoalCard
        v-for="goal in goalStore.filteredGoals"
        :key="goal.id"
        :goal="goal"
      />
    </div>

    <!-- حالت خالی -->
    <AppEmptyState
      v-else
      title="هدفی با این مشخصات یافت نشد"
      description="می‌توانید فیلتر وضعیت را تغییر دهید یا یک هدف جدید تعریف نمایید."
    >
      <template #action>
        <AppButton variant="primary" size="md" @click="isCreateModalOpen = true">
          تعریف هدف جدید
        </AppButton>
      </template>
    </AppEmptyState>

    <GoalFormModal
      :is-open="isCreateModalOpen"
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

.actions-bar {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
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
</style>
