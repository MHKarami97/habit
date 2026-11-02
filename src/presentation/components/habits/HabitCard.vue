<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Habit } from '@/domain/entities/Habit';
import { useHabitStore } from '../../stores/useHabitStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppIcon from '../common/AppIcon.vue';
import HabitValueModal from './HabitValueModal.vue';

const props = defineProps<{
  habit: Habit;
}>();

const router = useRouter();
const habitStore = useHabitStore();
const { effectiveTodayIso, localizeDigits } = usePersianCalendar();

const isValueModalOpen = ref(false);

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

const handleIncrement = async () => {
  await habitStore.checkIn({
    habitId: props.habit.id,
    date: effectiveTodayIso.value
  });
};

const handleDecrement = async () => {
  const curVal = todayLog.value?.value || 0;
  if (curVal <= 0) return;
  const step = props.habit.habitType === 'duration' ? 15 : 1;
  const nextVal = Math.max(0, curVal - step);
  await habitStore.checkIn({
    habitId: props.habit.id,
    date: effectiveTodayIso.value,
    customValue: nextVal
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

        <!-- هدف مقداری روزانه با قابلیت کلیک برای ویرایش -->
        <button
          v-if="habit.habitType !== 'boolean'"
          type="button"
          class="meta-target-btn touch-target"
          title="ویرایش مستقیم مقدار امروز"
          @click.stop="isValueModalOpen = true"
        >
          <AppIcon name="edit" size="12" />
          {{ localizeDigits(todayLog?.value || 0) }} / {{ localizeDigits(habit.dailyTarget) }} {{ habit.unit }}
        </button>
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

      <!-- برای عادت‌های تعدادی و زمانی: استپر کنترل کامل با قابلیت کاهش، افزایش و ویرایش مستقیم -->
      <div v-if="habit.habitType !== 'boolean'" class="numeric-stepper-group" @click.stop>
        <button
          type="button"
          class="stepper-sub-btn touch-target"
          :disabled="(todayLog?.value || 0) <= 0"
          title="کاهش یک واحد (برگشت در صورت ثبت اشتباه)"
          @click.stop="handleDecrement"
        >
          <AppIcon name="minus" size="14" />
        </button>

        <button
          type="button"
          :class="['stepper-val-btn touch-target', { 'is-reached': isCompletedToday }]"
          title="ویرایش مستقیم مقدار ثبت‌شده"
          @click.stop="isValueModalOpen = true"
        >
          <span class="stepper-val-num">{{ localizeDigits(todayLog?.value || 0) }}</span>
          <span class="stepper-val-target">/ {{ localizeDigits(habit.dailyTarget) }}</span>
        </button>

        <button
          type="button"
          :class="['stepper-add-btn touch-target', { 'is-checked': isCompletedToday }]"
          :title="isCompletedToday ? 'تکمیل شد (افزودن بیشتر)' : 'افزایش یک واحد'"
          @click.stop="handleIncrement"
        >
          <AppIcon v-if="isCompletedToday" name="check" size="16" class="animate-pop" />
          <AppIcon v-else name="plus" size="14" />
        </button>
      </div>

      <!-- دکمه اصلی تیک عادت با یک لمس برای عادت‌های بولی -->
      <button
        v-else
        type="button"
        :class="['check-toggle-btn touch-target', { 'is-checked': isCompletedToday }]"
        :aria-label="isCompletedToday ? 'علامت‌گذاری به عنوان انجام نشده' : 'ثبت انجام عادت'"
        @click.stop="handleCheckIn"
      >
        <AppIcon v-if="isCompletedToday" name="check" size="22" class="animate-pop" />
      </button>
    </div>

    <!-- مودال ویرایش دقیق مقدار عددی عادت -->
    <HabitValueModal
      :is-open="isValueModalOpen"
      :habit="habit"
      :current-value="todayLog?.value || 0"
      :date="effectiveTodayIso"
      @close="isValueModalOpen = false"
    />
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
}

.habit-card.habit-completed {
  border-color: var(--color-success);
  background-color: var(--color-success-subtle);
}

.habit-card.habit-frozen {
  border-color: var(--color-info);
  background-color: var(--color-info-subtle);
}

.habit-main-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  cursor: pointer;
  min-width: 0;
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
  flex-wrap: wrap;
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

.meta-target-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.meta-target-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
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

/* Numeric Stepper Styles */
.numeric-stepper-group {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-full);
  padding: 2px;
  gap: 2px;
}

.stepper-sub-btn,
.stepper-add-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background-color: transparent;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.stepper-sub-btn:hover:not(:disabled) {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
}

.stepper-sub-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.stepper-add-btn:hover {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.stepper-add-btn.is-checked {
  background-color: var(--color-success);
  color: #ffffff;
}

.stepper-val-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background-color: transparent;
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all var(--transition-fast);
}

.stepper-val-btn:hover {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-accent);
}

.stepper-val-num {
  font-weight: 700;
  color: var(--color-text-primary);
}

.stepper-val-btn.is-reached .stepper-val-num {
  color: var(--color-success);
}

.stepper-val-target {
  color: var(--color-text-muted);
  font-size: 11px;
}
</style>
