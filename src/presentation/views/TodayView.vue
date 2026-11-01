<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGoalStore } from '../stores/useGoalStore';
import { useHabitStore } from '../stores/useHabitStore';
import { useReminderStore } from '../stores/useReminderStore';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import { ActionLog } from '@/domain/entities/ActionLog';
import { container } from '@/infrastructure/di/container';
import HabitCard from '../components/habits/HabitCard.vue';
import GoalCard from '../components/goals/GoalCard.vue';
import AppEmptyState from '../components/common/AppEmptyState.vue';
import AppButton from '../components/common/AppButton.vue';
import AppProgressRing from '../components/common/AppProgressRing.vue';
import AppIcon from '../components/common/AppIcon.vue';
import HabitFormModal from '../components/habits/HabitFormModal.vue';
import GoalFormModal from '../components/goals/GoalFormModal.vue';
import BehavioralTipBanner from '../components/help/BehavioralTipBanner.vue';
import { BehavioralTipEvaluator, type BehavioralTip } from '../data/behavioralTips';
import type { ObstacleLog } from '@/domain/entities/ObstacleLog';
import type { HabitLog } from '@/domain/entities/HabitLog';

const goalStore = useGoalStore();
const habitStore = useHabitStore();
const reminderStore = useReminderStore();
const { effectiveTodayIso, formatLongDate, localizeDigits } = usePersianCalendar();

const isHabitModalOpen = ref(false);
const isGoalModalOpen = ref(false);
const activeGoalsNextSteps = ref<{ goalId: string; goalTitle: string; nextStep: string }[]>([]);
const behavioralTips = ref<BehavioralTip[]>([]);
const dismissedTipIds = ref<Set<string>>(new Set());

const activeTips = computed(() => {
  return behavioralTips.value.filter(t => !dismissedTipIds.value.has(t.id));
});

const handleDismissTip = (tipId: string) => {
  dismissedTipIds.value.add(tipId);
};

const evaluateBehavioralTips = async () => {
  const recentLogsMap = new Map<string, readonly HabitLog[]>();
  for (const habit of habitStore.habits) {
    if (!habit.isArchived) {
      const logs = await container.habitLogRepo.findLogsByHabitId(habit.id);
      recentLogsMap.set(habit.id, logs);
    }
  }

  const allObstacles: ObstacleLog[] = [];
  for (const goal of goalStore.goals) {
    const obstacles = await container.goalRepo.findObstacleLogsByGoalId(goal.id);
    allObstacles.push(...obstacles);
  }

  behavioralTips.value = BehavioralTipEvaluator.evaluateTips({
    habits: habitStore.habits,
    goals: goalStore.goals,
    todayLogs: habitStore.todayLogs,
    recentLogsMap,
    obstacles: allObstacles,
    effectiveTodayIso: effectiveTodayIso.value
  });
};

const loadActiveGoalsNextSteps = async () => {
  const steps: { goalId: string; goalTitle: string; nextStep: string }[] = [];
  for (const g of goalStore.goals) {
    if (g.status === 'active' && !g.isArchived) {
      const logs: readonly ActionLog[] = await container.goalRepo.findActionLogsByGoalId(g.id);
      const latestWithNext = logs.find(l => Boolean(l.nextStep));
      if (latestWithNext?.nextStep) {
        steps.push({
          goalId: g.id,
          goalTitle: g.title,
          nextStep: latestWithNext.nextStep
        });
      }
    }
  }
  activeGoalsNextSteps.value = steps;
};

onMounted(async () => {
  await Promise.all([
    goalStore.loadGoals(),
    habitStore.loadHabits(),
    habitStore.loadTodayLogs(effectiveTodayIso.value)
  ]);
  await Promise.all([
    loadActiveGoalsNextSteps(),
    evaluateBehavioralTips()
  ]);

  // بررسی هشدارهای یادآور درون‌برنامه برای ساعت جاری
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  await reminderStore.evaluateTodayAlerts(effectiveTodayIso.value, minutes);
});

const handleQuickCheckIn = async (habitId: string) => {
  const habit = habitStore.habits.find(h => h.id === habitId);
  if (!habit) return;
  await habitStore.checkIn({
    habitId: habit.id,
    date: effectiveTodayIso.value,
    customValue: habit.dailyTarget
  });
  reminderStore.dismissAlert(`inapp-${habitId}-${effectiveTodayIso.value}`);
};

const todayHabits = computed(() => {
  return habitStore.habits.filter(h => !h.isPaused && !h.isArchived);
});

const activeGoals = computed(() => {
  return goalStore.goals.filter(g => g.status === 'active' && !g.isArchived);
});

const todayCompletedCount = computed(() => {
  return todayHabits.value.filter(h => habitStore.isHabitCompletedToday(h.id)).length;
});

const todayProgressPercentage = computed(() => {
  if (todayHabits.value.length === 0) return 0;
  return Math.round((todayCompletedCount.value / todayHabits.value.length) * 100);
});
</script>

<template>
  <div class="today-view-container">
    <!-- هدر تاریخ و خلاصه‌ی کوتاه روز -->
    <header class="today-hero-card">
      <div class="hero-text-col">
        <span class="hero-date-badge">{{ formatLongDate(effectiveTodayIso) }}</span>
        <h2 class="hero-greeting">امروز شما در یک نگاه</h2>
        <p class="hero-summary">
          {{ localizeDigits(todayCompletedCount) }} از {{ localizeDigits(todayHabits.length) }} عادت امروز تکمیل شده است.
        </p>
      </div>

      <div class="hero-ring-col">
        <AppProgressRing
          :percentage="todayProgressPercentage"
          :size="68"
          :stroke-width="7"
        />
      </div>
    </header>

    <!-- نکات رفتاری و انگیزشی مبتنی بر شواهد علمی -->
    <section v-if="activeTips.length > 0" class="behavioral-tips-section">
      <BehavioralTipBanner
        v-for="tip in activeTips"
        :key="tip.id"
        :tip="tip"
        @dismiss="handleDismissTip"
      />
    </section>

    <!-- بنر یادآور عادات انجام‌نشده‌ی امروز -->
    <section v-if="reminderStore.dueAlerts.length > 0" class="in-app-reminders-banner animate-slide-up">
      <div class="reminder-header">
        <AppIcon name="clock" size="20" class="reminder-bell-icon" />
        <div class="reminder-header-text">
          <strong class="reminder-title">یادآور عادات انجام‌نشده‌ی امروز</strong>
          <span class="reminder-subtitle">موعد انجام {{ localizeDigits(reminderStore.dueAlerts.length) }} عادت فرارسیده است.</span>
        </div>
      </div>
      <div class="reminder-items-list">
        <div v-for="alert in reminderStore.dueAlerts" :key="alert.id" class="reminder-item-card">
          <div class="reminder-item-info">
            <span class="reminder-item-time">{{ localizeDigits(alert.time) }}</span>
            <strong class="reminder-item-title">{{ alert.title }}</strong>
            <span v-if="alert.body" class="reminder-item-cue">{{ alert.body }}</span>
          </div>
          <div class="reminder-item-actions">
            <AppButton
              variant="primary"
              size="sm"
              @click="handleQuickCheckIn(alert.entityId)"
            >
              ثبت انجام
            </AppButton>
            <button class="dismiss-btn touch-target" title="رد کردن" @click="reminderStore.dismissAlert(alert.id)">
              <AppIcon name="x" size="16" />
            </button>
          </div>
        </div>
      </div>
    </section>

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
            ثبت پیوسته با یک لمس
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

    <!-- قدم‌های بعدی اهداف فعال (Next Steps) -->
    <section v-if="activeGoalsNextSteps.length > 0" class="section-block">
      <div class="section-header">
        <div>
          <h2 class="section-title">قدم‌های بعدی اهداف فعال</h2>
          <span class="section-subtitle">اقدام‌های خرد و بدون بهانه‌جویی</span>
        </div>
      </div>

      <div class="next-steps-grid">
        <RouterLink
          v-for="item in activeGoalsNextSteps"
          :key="item.goalId"
          :to="`/goals/${item.goalId}`"
          class="next-step-card"
        >
          <div class="next-step-badge">
            <AppIcon name="target" size="14" />
            <span>{{ item.goalTitle }}</span>
          </div>
          <p class="next-step-text">{{ item.nextStep }}</p>
        </RouterLink>
      </div>
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

.today-hero-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.hero-text-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-date-badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-accent);
}

.hero-greeting {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-text-primary);
}

.hero-summary {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
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

.next-steps-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xs);
}
@media (min-width: 640px) {
  .next-steps-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.next-step-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all var(--transition-fast);
}
.next-step-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-xs);
  transform: translateY(-1px);
}

.next-step-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
}

.next-step-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: 500;
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

.in-app-reminders-banner {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-accent);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
}

.reminder-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.reminder-bell-icon {
  color: var(--color-accent);
}

.reminder-header-text {
  display: flex;
  flex-direction: column;
}

.reminder-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.reminder-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.reminder-items-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.reminder-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-bg-surface-soft);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  gap: var(--spacing-sm);
}

.reminder-item-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.reminder-item-time {
  font-size: 11px;
  font-weight: 700;
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.reminder-item-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.reminder-item-cue {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.reminder-item-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.dismiss-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}
.dismiss-btn:hover {
  color: var(--color-text-primary);
}
</style>
