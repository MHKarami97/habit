<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useHabitStore } from '../stores/useHabitStore';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import { Habit } from '@/domain/entities/Habit';
import HabitCard from '../components/habits/HabitCard.vue';
import HabitFormModal from '../components/habits/HabitFormModal.vue';
import BackfillModal from '../components/habits/BackfillModal.vue';
import AppEmptyState from '../components/common/AppEmptyState.vue';
import AppButton from '../components/common/AppButton.vue';
import AppIcon from '../components/common/AppIcon.vue';
import { useVirtualWindow } from '../composables/useVirtualWindow';

const habitStore = useHabitStore();
const { effectiveTodayIso, localizeDigits } = usePersianCalendar();

const isCreateModalOpen = ref(false);
const isBackfillModalOpen = ref(false);
const selectedHabitForBackfill = ref<Habit | null>(null);

const {
  visibleItems: visibleHabits,
  hasMore: hasMoreHabits,
  loadMore: loadMoreHabits,
  totalCount: totalHabitsCount
} = useVirtualWindow(() => habitStore.habits, { pageSize: 24 });

onMounted(async () => {
  await Promise.all([
    habitStore.loadHabits(),
    habitStore.loadTodayLogs(effectiveTodayIso.value)
  ]);
});

const openBackfill = (habit: Habit) => {
  selectedHabitForBackfill.value = habit;
  isBackfillModalOpen.value = true;
};
</script>

<template>
  <div class="habits-view-container">
    <div class="top-actions-bar">
      <div class="intro-stats">
        <h2 class="view-title">عادت‌های فعال</h2>
        <span class="view-subtitle">استمرار و پیوستگی در روزهای متوالی</span>
      </div>

      <AppButton variant="primary" size="md" @click="isCreateModalOpen = true">
        <AppIcon name="plus" size="18" />
        عادت جدید
      </AppButton>
    </div>

    <div v-if="visibleHabits.length > 0" class="habits-cards-list">
      <div v-for="habit in visibleHabits" :key="habit.id" class="habit-item-wrapper">
        <HabitCard :habit="habit" />
        <div class="habit-item-secondary-bar">
          <button
            type="button"
            class="backfill-trigger-btn"
            @click="openBackfill(habit)"
          >
            <AppIcon name="calendar" size="14" />
            ثبت برای روزهای گذشته (Backfill)
          </button>

          <button
            type="button"
            class="pause-toggle-btn"
            @click="habitStore.togglePause(habit)"
          >
            {{ habit.isPaused ? 'ازسرگیری عادت' : 'توقف موقت' }}
          </button>
        </div>
      </div>
    </div>

    <!-- دکمه بارگذاری موارد بیشتر برای لیست‌های بزرگ -->
    <div v-if="hasMoreHabits" class="load-more-row">
      <AppButton variant="secondary" size="sm" @click="loadMoreHabits">
        نمایش عادات بیشتر (نمایش {{ localizeDigits(visibleHabits.length) }} از {{ localizeDigits(totalHabitsCount) }})
      </AppButton>
    </div>

    <AppEmptyState
      v-else
      title="هنوز عادتی اضافه نکرده‌اید"
      description="عادت‌ها سنگ‌بنای شکل‌گیری شخصیت و دستیابی به اهداف هستند."
    >
      <template #action>
        <AppButton variant="primary" size="md" @click="isCreateModalOpen = true">
          تعریف اولین عادت
        </AppButton>
      </template>
    </AppEmptyState>

    <HabitFormModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
    />

    <BackfillModal
      :is-open="isBackfillModalOpen"
      :habit="selectedHabitForBackfill"
      @close="isBackfillModalOpen = false"
    />
  </div>
</template>

<style scoped>
.habits-view-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-xl);
}

.top-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-text-primary);
}

.view-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.habits-cards-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.habit-item-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.habit-item-secondary-bar {
  display: flex;
  justify-content: space-between;
  padding: 0 var(--spacing-xs);
  font-size: 11px;
}

.backfill-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  font-weight: 500;
}
.backfill-trigger-btn:hover {
  color: var(--color-accent);
}

.pause-toggle-btn {
  color: var(--color-text-muted);
}
.pause-toggle-btn:hover {
  color: var(--color-text-secondary);
}

.load-more-row {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-md);
}
</style>
