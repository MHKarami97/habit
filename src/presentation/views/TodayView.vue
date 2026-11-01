<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGoalStore } from '../stores/useGoalStore';
import { useHabitStore } from '../stores/useHabitStore';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import HabitCard from '../components/habits/HabitCard.vue';
import GoalCard from '../components/goals/GoalCard.vue';
import AppEmptyState from '../components/common/AppEmptyState.vue';
import AppButton from '../components/common/AppButton.vue';
import AppIcon from '../components/common/AppIcon.vue';
import HabitFormModal from '../components/habits/HabitFormModal.vue';
import GoalFormModal from '../components/goals/GoalFormModal.vue';

const goalStore = useGoalStore();
const habitStore = useHabitStore();
const { effectiveTodayIso } = usePersianCalendar();

const isHabitModalOpen = ref(false);
const isGoalModalOpen = ref(false);

onMounted(async () => {
  await Promise.all([
    goalStore.loadGoals(),
    habitStore.loadHabits(),
    habitStore.loadTodayLogs(effectiveTodayIso.value)
  ]);
});

const todayHabits = computed(() => {
  return habitStore.habits.filter(h => !h.isPaused && !h.isArchived);
});

const activeGoals = computed(() => {
  return goalStore.goals.filter(g => g.status === 'active' && !g.isArchived);
});

const todayCompletedCount = computed(() => {
  return todayHabits.value.filter(h => habitStore.isHabitCompletedToday(h.id)).length;
});
</script>

<template>
  <div class="today-view-container">
    <!-- هشدارهای هوشمند سیستم -->
    <section v-if="goalStore.smartAlerts.length > 0" class="alerts-section">
      <div
        v-for="alert in goalStore.smartAlerts"
        :key="alert.id"
        :class="['alert-banner', `alert-${alert.type}`]"
      >
        <AppIcon name="alert" size="18" class="alert-icon" />
        <div class="alert-content">
          <strong class="alert-title">{{ alert.title }}</strong>
          <p class="alert-msg">{{ alert.message }}</p>
        </div>
      </div>
    </section>

    <!-- ردیابی عادات امروز -->
    <section class="section-block">
      <div class="section-header">
        <div>
          <h2 class="section-title">عادت‌های امروز</h2>
          <span class="section-subtitle">
            {{ todayCompletedCount }} از {{ todayHabits.length }} عادت تکمیل شده
          </span>
        </div>

        <AppButton variant="secondary" size="sm" @click="isHabitModalOpen = true">
          <AppIcon name="plus" size="16" />
          عادت جدید
        </AppButton>
      </div>

      <div v-if="todayHabits.length > 0" class="habits-list">
        <HabitCard
          v-for="habit in todayHabits"
          :key="habit.id"
          :habit="habit"
        />
      </div>
      <AppEmptyState
        v-else
        title="هنوز عادتی برای امروز ثبت نشده است"
        description="با ثبت اولین عادت کوچک روزانه، مسیر پیوسته رشد فردی خود را آغاز کنید."
      >
        <template #action>
          <AppButton variant="primary" size="md" @click="isHabitModalOpen = true">
            تعریف اولین عادت
          </AppButton>
        </template>
      </AppEmptyState>
    </section>

    <!-- اهداف فعال و جاری -->
    <section class="section-block">
      <div class="section-header">
        <div>
          <h2 class="section-title">اهداف فعال</h2>
          <span class="section-subtitle">تمرکز روی اولویت‌های اصلی</span>
        </div>

        <AppButton variant="secondary" size="sm" @click="isGoalModalOpen = true">
          <AppIcon name="plus" size="16" />
          هدف جدید
        </AppButton>
      </div>

      <div v-if="activeGoals.length > 0" class="goals-grid">
        <GoalCard
          v-for="goal in activeGoals"
          :key="goal.id"
          :goal="goal"
        />
      </div>
      <AppEmptyState
        v-else
        title="هیچ هدف فعالی در جریان نیست"
        description="یک هدف معنادار با مهلت مشخص تعیین کنید و قدم‌های آن را مشخص نمایید."
      >
        <template #action>
          <AppButton variant="primary" size="md" @click="isGoalModalOpen = true">
            ایجاد اولین هدف
          </AppButton>
        </template>
      </AppEmptyState>
    </section>

    <!-- مودال‌های ثبت سریع -->
    <HabitFormModal :is-open="isHabitModalOpen" @close="isHabitModalOpen = false" />
    <GoalFormModal :is-open="isGoalModalOpen" @close="isGoalModalOpen = false" />
  </div>
</template>

<style scoped>
.today-view-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-xl);
}

.alerts-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: var(--border-width-hairline) solid transparent;
}

.alert-warning {
  background-color: var(--color-warning-subtle);
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.alert-danger {
  background-color: var(--color-danger-subtle);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  display: flex;
  flex-direction: column;
}

.alert-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

.alert-msg {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-text-primary);
}

.section-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.goals-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

@media (min-width: 640px) {
  .goals-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
