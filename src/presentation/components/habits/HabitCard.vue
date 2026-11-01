<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Habit } from '@/domain/entities/Habit';
import { useHabitStore } from '../../stores/useHabitStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppIcon from '../common/AppIcon.vue';

const props = defineProps<{
  habit: Habit;
}>();

const router = useRouter();
const habitStore = useHabitStore();
const { effectiveTodayIso, localizeDigits } = usePersianCalendar();

const isCompletedToday = computed(() => {
  return habitStore.isHabitCompletedToday(props.habit.id);
});

const isFrozenToday = computed(() => {
  return habitStore.isHabitFrozenToday(props.habit.id);
});

const todayLog = computed(() => {
  return habitStore.getTodayLogForHabit(props.habit.id);
});

const streakAnalysis = computed(() => {
  return habitStore.getStreakAnalysis(props.habit, effectiveTodayIso.value);
});

const goToDetail = () => {
  router.push(`/habits/${props.habit.id}`);
};

const handleCheckIn = async () => {
  await habitStore.checkIn({
    habitId: props.habit.id,
    date: effectiveTodayIso.value
  });
};

const handleToggleFreeze = async () => {
  await habitStore.toggleFreeze(props.habit.id, effectiveTodayIso.value);
};
</script>

<template>
  <article :class="['habit-card', { 'habit-completed': isCompletedToday, 'habit-frozen': isFrozenToday }]">
    <div class="habit-main-col" role="button" tabindex="0" @click="goToDetail">
      <div class="habit-header-row">
        <h4 class="habit-title">{{ habit.title }}</h4>
        <span v-if="habit.cue" class="habit-cue-badge" title="محرک و لنگر رفتاری">
          {{ habit.cue }}
        </span>
      </div>

      <div class="habit-meta-row">
        <!-- استریک جاری -->
        <span class="meta-streak-badge" title="استریک پیوسته">
          <AppIcon name="flame" size="14" class="flame-icon" />
          {{ localizeDigits(streakAnalysis.currentStreak) }} روز
        </span>

        <!-- نرخ پایبندی -->
        <span class="meta-adherence" title="نرخ پایبندی در روزهای موعد">
          {{ localizeDigits(streakAnalysis.adherenceRate) }}٪ پایبندی
        </span>

        <!-- هدف مقداری روزانه -->
        <span v-if="habit.habitType !== 'boolean'" class="meta-target">
          {{ localizeDigits(todayLog?.value || 0) }} / {{ localizeDigits(habit.dailyTarget) }} {{ habit.unit }}
        </span>
      </div>
    </div>

    <!-- دکمه‌های اکشن سریع -->
    <div class="habit-actions-col">
      <!-- دکمه روز آزاد (Freeze) -->
      <button
        v-if="habit.weeklyFreezeAllowed"
        type="button"
        :class="['freeze-btn touch-target', { 'freeze-active': isFrozenToday }]"
        title="روز آزاد / استراحت مجاز (Freeze)"
        @click.stop="handleToggleFreeze"
      >
        <AppIcon name="snowflake" size="16" />
      </button>

      <!-- دکمه اصلی تیک عادت با یک لمس -->
      <button
        type="button"
        :class="['check-toggle-btn touch-target', { 'is-checked': isCompletedToday }]"
        :aria-label="isCompletedToday ? 'علامت‌گذاری به عنوان انجام نشده' : 'ثبت انجام عادت'"
        @click.stop="handleCheckIn"
      >
        <AppIcon v-if="isCompletedToday" name="check" size="22" class="animate-pop" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.habit-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  box-shadow: var(--shadow-xs);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  transition: all var(--transition-fast);
}

.habit-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.habit-completed {
  border-color: var(--color-success);
  background-color: var(--color-bg-surface);
}

.habit-frozen {
  border-color: var(--color-info);
  background-color: var(--color-info-subtle);
}

.habit-main-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  flex: 1;
  cursor: pointer;
}

.habit-header-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.habit-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.habit-cue-badge {
  font-size: 11px;
  color: var(--color-text-muted);
  background-color: var(--color-bg-surface-soft);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.habit-meta-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.meta-streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 700;
  color: var(--color-accent);
}

.flame-icon {
  color: var(--color-accent);
}

.meta-adherence {
  color: var(--color-text-secondary);
}

.meta-target {
  color: var(--color-text-muted);
}

.habit-actions-col {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.freeze-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  background-color: transparent;
  transition: all var(--transition-fast);
}

.freeze-btn:hover {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-info);
}

.freeze-active {
  background-color: var(--color-info);
  color: #ffffff !important;
}

.check-toggle-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: var(--border-width-bold) solid var(--color-border-strong);
  background-color: transparent;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.check-toggle-btn:hover {
  border-color: var(--color-accent);
}

.check-toggle-btn.is-checked {
  background-color: var(--color-success);
  border-color: var(--color-success);
}
</style>
