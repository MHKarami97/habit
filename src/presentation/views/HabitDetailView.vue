<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useHabitStore } from '../stores/useHabitStore';
import { useGoalStore } from '../stores/useGoalStore';
import { useReminderStore } from '../stores/useReminderStore';
import { useTemplateStore } from '../stores/useTemplateStore';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import { SolarDateMath, SOLAR_MONTH_NAMES } from '@/infrastructure/calendar/SolarDateMath';
import { getHabitTypeLabel } from '@/domain/value-objects/HabitType';
import { db } from '@/infrastructure/db/AppDatabase';
import AppButton from '../components/common/AppButton.vue';
import AppIcon from '../components/common/AppIcon.vue';
import BackfillModal from '../components/habits/BackfillModal.vue';

const route = useRoute();
const router = useRouter();
const habitStore = useHabitStore();
const goalStore = useGoalStore();
const reminderStore = useReminderStore();
const templateStore = useTemplateStore();
const saveTemplateSuccess = ref(false);
const { effectiveTodayIso, localizeDigits, formatShortDate } = usePersianCalendar();

const habitId = computed(() => String(route.params.id));
const habit = computed(() => habitStore.habits.find(h => h.id === habitId.value));
const linkedGoal = computed(() => {
  if (!habit.value?.linkedGoalId) return null;
  return goalStore.goals.find(g => g.id === habit.value?.linkedGoalId);
});

const isBackfillModalOpen = ref(false);

onMounted(async () => {
  if (habitStore.habits.length === 0) {
    await habitStore.loadHabits();
  }
  if (goalStore.goals.length === 0) {
    await goalStore.loadGoals();
  }
  await habitStore.loadLogsForHabit(habitId.value);
});

const logs = computed(() => habitStore.habitLogsMap.get(habitId.value) || []);

const streakAnalysis = computed(() => {
  if (!habit.value) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      adherenceRate: 100,
      totalCompletedDays: 0,
      totalDueDays: 0,
      milestones: [],
      weakestDay: null
    };
  }
  return habitStore.getStreakAnalysis(habit.value, effectiveTodayIso.value);
});

// تقویم شمسی ماه جاری برای هیت‌مپ
const currentSolar = computed(() => {
  const parts = effectiveTodayIso.value.split('-').map(Number);
  return SolarDateMath.gregorianToSolar(parts[0] ?? 2026, parts[1] ?? 11, parts[2] ?? 1);
});

const currentMonthName = computed(() => SOLAR_MONTH_NAMES[currentSolar.value.month - 1] ?? '');

const daysInMonth = computed(() => {
  return SolarDateMath.getDaysInSolarMonth(currentSolar.value.year, currentSolar.value.month);
});

const firstDayOffset = computed(() => {
  const g = SolarDateMath.solarToDate(currentSolar.value.year, currentSolar.value.month, 1);
  return (g.getDay() + 1) % 7; // شنبه = ۰
});

const monthlyHeatmapDays = computed(() => {
  const days: { dayNumber: number; isoDate: string; isCompleted: boolean; isFrozen: boolean }[] = [];
  const logMap = new Map<string, { isCompleted: boolean; isFrozen: boolean }>();
  logs.value.forEach(l => logMap.set(l.date, { isCompleted: l.isCompleted, isFrozen: l.isFrozen }));

  for (let d = 1; d <= daysInMonth.value; d++) {
    const g = SolarDateMath.solarToGregorian(currentSolar.value.year, currentSolar.value.month, d);
    const mStr = String(g.month).padStart(2, '0');
    const dStr = String(g.day).padStart(2, '0');
    const isoDate = `${g.year}-${mStr}-${dStr}`;

    const entry = logMap.get(isoDate);
    days.push({
      dayNumber: d,
      isoDate,
      isCompleted: Boolean(entry?.isCompleted),
      isFrozen: Boolean(entry?.isFrozen)
    });
  }

  return days;
});

const limitationNotice = ref('');

const handleExportIcs = async () => {
  if (!habit.value) return;
  const habitRecord = await db.habits.get(habit.value.id);
  if (habitRecord) {
    const notice = reminderStore.downloadHabitIcs(habitRecord);
    if (notice) {
      limitationNotice.value = notice;
    }
  }
};

const handleSaveAsTemplate = async () => {
  if (!habit.value) return;
  await templateStore.saveHabitAsTemplate(habit.value);
  saveTemplateSuccess.value = true;
  setTimeout(() => {
    saveTemplateSuccess.value = false;
  }, 2500);
};

const handleDelete = async () => {
  if (!habit.value) return;
  if (confirm(`آیا از حذف عادت «${habit.value.title}» و تاریخچه آن مطمئن هستید؟`)) {
    await habitStore.deleteHabit(habit.value.id);
    router.push('/habits');
  }
};
</script>

<template>
  <div v-if="habit" class="habit-detail-container">
    <!-- هدر ناوبری -->
    <div class="top-nav-bar">
      <RouterLink to="/habits" class="back-link">
        <AppIcon name="chevron-right" size="20" />
        بازگشت به عادت‌ها
      </RouterLink>

      <div class="header-actions">
        <AppButton variant="outline" size="sm" @click="handleExportIcs">
          <AppIcon name="clock" size="16" />
          تقویم گوشی (.ics)
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="handleSaveAsTemplate">
          <AppIcon name="settings" size="16" />
          {{ saveTemplateSuccess ? 'قالب ذخیره شد!' : 'ذخیره به عنوان قالب' }}
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="isBackfillModalOpen = true">
          <AppIcon name="calendar" size="16" />
          ثبت روزهای قبل
        </AppButton>
        <AppButton variant="ghost" size="sm" @click="handleDelete">
          <AppIcon name="trash" size="16" />
        </AppButton>
      </div>
    </div>

    <!-- توضیح محدودیت RRULE تقویم در صورت وجود -->
    <div v-if="limitationNotice" class="calendar-limitation-notice animate-slide-up">
      <AppIcon name="alert" size="18" />
      <span>{{ limitationNotice }}</span>
    </div>

    <!-- کارت اطلاعات کلی عادت -->
    <article class="detail-overview-card">
      <header class="detail-header">
        <div>
          <h2 class="detail-title">{{ habit.title }}</h2>
          <span class="habit-type-label">
            نوع عادت: {{ getHabitTypeLabel(habit.habitType) }}
          </span>
        </div>
        <span :class="['habit-status-pill', { 'pill-paused': habit.isPaused }]">
          {{ habit.isPaused ? 'متوقف‌شده' : 'در جریان' }}
        </span>
      </header>

      <div v-if="habit.cue" class="cue-box">
        <strong>لنگر رفتاری (Cue):</strong> {{ habit.cue }}
      </div>

      <!-- اتصال به هدف و سهم آن -->
      <div v-if="linkedGoal" class="linked-goal-box">
        <div class="linked-goal-header">
          <AppIcon name="target" size="16" class="goal-icon" />
          <span>متصل به هدف:</span>
          <RouterLink :to="`/goals/${linkedGoal.id}`" class="goal-name-link">
            {{ linkedGoal.title }}
          </RouterLink>
        </div>
        <p class="goal-contribution-text">
          هر بار تکمیل این عادت، مستقیماً به پیشبرد سنجه عددی این هدف کمک می‌کند.
        </p>
      </div>

      <!-- شاخص‌های کلیدی استریک -->
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-value text-accent">
            <AppIcon name="flame" size="20" />
            {{ localizeDigits(streakAnalysis.currentStreak) }}
          </span>
          <span class="metric-label">استریک پیوسته (روز)</span>
        </div>

        <div class="metric-card">
          <span class="metric-value">
            {{ localizeDigits(streakAnalysis.longestStreak) }}
          </span>
          <span class="metric-label">طولانی‌ترین استریک</span>
        </div>

        <div class="metric-card">
          <span class="metric-value text-success">
            {{ localizeDigits(streakAnalysis.adherenceRate) }}٪
          </span>
          <span class="metric-label">نرخ پایبندی کل</span>
        </div>
      </div>

      <!-- هشدار ضعیف‌ترین روز هفته -->
      <div v-if="streakAnalysis.weakestDay" class="weakest-day-card">
        <AppIcon name="alert" size="18" class="warning-icon" />
        <div class="weakest-day-content">
          <strong>نقطه آسیب‌پذیر هفته: {{ streakAnalysis.weakestDay.dayName }}‌ها</strong>
          <p>
            پایبندی شما در این روز {{ localizeDigits(streakAnalysis.weakestDay.rate) }}٪ بوده است. پیشنهاد می‌شود برای این روز از تکنیک مانع‌زدایی و کاهش حجم کار استفاده فرمایید.
          </p>
        </div>
      </div>
    </article>

    <!-- نقشه گرمایی شمسی ماه جاری -->
    <section class="section-card">
      <div class="section-header">
        <h3 class="section-heading">
          تقویم شمسی ماهانه ({{ currentMonthName }} {{ localizeDigits(currentSolar.year) }})
        </h3>
        <span class="section-subtext">روند پیوستگی در روزهای ماه</span>
      </div>

      <div class="persian-month-heatmap">
        <div class="heatmap-weekday-headers">
          <span>ش</span><span>ی</span><span>د</span><span>س</span><span>چ</span><span>پ</span><span>ج</span>
        </div>

        <div class="heatmap-cells-grid">
          <div
            v-for="b in firstDayOffset"
            :key="`b-${b}`"
            class="empty-cell"
          />

          <div
            v-for="day in monthlyHeatmapDays"
            :key="day.isoDate"
            :class="[
              'day-cell',
              {
                'cell-done': day.isCompleted,
                'cell-frozen': day.isFrozen,
                'cell-empty': !day.isCompleted && !day.isFrozen
              }
            ]"
            :title="`${formatShortDate(day.isoDate)}: ${day.isCompleted ? 'تکمیل شد' : (day.isFrozen ? 'روز فریز' : 'انجام‌نشده')}`"
          >
            {{ localizeDigits(day.dayNumber) }}
          </div>
        </div>
      </div>

      <div class="heatmap-legend-row">
        <div class="legend-item">
          <div class="legend-box cell-done" />
          <span>انجام‌شده</span>
        </div>
        <div class="legend-item">
          <div class="legend-box cell-frozen" />
          <span>روز آزاد (Freeze)</span>
        </div>
        <div class="legend-item">
          <div class="legend-box cell-empty" />
          <span>ثبت‌نشده</span>
        </div>
      </div>
    </section>

    <!-- نقاط عطف رفتار (Milestones) -->
    <section class="section-card">
      <h3 class="section-heading">مسیر تثبیت رفتار و نقاط عطف</h3>
      <div class="milestones-track-list">
        <div
          v-for="ms in streakAnalysis.milestones"
          :key="ms.targetDays"
          :class="['milestone-card', { 'milestone-done': ms.isReached }]"
        >
          <div class="ms-status-icon">
            <AppIcon :name="ms.isReached ? 'check' : 'flame'" size="16" />
          </div>
          <div class="ms-info">
            <span class="ms-title">{{ ms.title }}</span>
            <div class="ms-bar-bg">
              <div class="ms-bar-fill" :style="{ width: `${ms.progressPercentage}%` }" />
            </div>
          </div>
          <span class="ms-pct">{{ localizeDigits(ms.progressPercentage) }}٪</span>
        </div>
      </div>
    </section>

    <BackfillModal
      :is-open="isBackfillModalOpen"
      :habit="habit"
      @close="isBackfillModalOpen = false"
    />
  </div>
</template>

<style scoped>
.habit-detail-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-2xl);
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xxs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 600;
}
.back-link:hover {
  color: var(--color-accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.detail-overview-card, .section-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-text-primary);
}

.habit-type-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.habit-status-pill {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background-color: var(--color-success-subtle);
  color: var(--color-success);
  font-size: var(--font-size-xs);
  font-weight: 700;
}
.habit-status-pill.pill-paused {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}

.cue-box {
  background-color: var(--color-bg-surface-soft);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.linked-goal-box {
  background-color: var(--color-accent-subtle);
  border: var(--border-width-hairline) solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.linked-goal-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-accent);
}

.goal-name-link {
  font-weight: 800;
  text-decoration: underline;
  color: var(--color-accent);
}

.goal-contribution-text {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.metric-card {
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
}

.metric-value {
  font-size: var(--font-size-xl);
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-primary);
}

.metric-label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.text-accent {
  color: var(--color-accent);
}
.text-success {
  color: var(--color-success);
}

.weakest-day-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  background-color: var(--color-warning-subtle);
  border: var(--border-width-hairline) solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
}

.warning-icon {
  color: var(--color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}

.weakest-day-content {
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: var(--color-text-primary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-heading {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.section-subtext {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.persian-month-heatmap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.heatmap-weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: var(--border-width-hairline) solid var(--color-border-subtle);
  padding-bottom: 4px;
}

.heatmap-cells-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.empty-cell {
  aspect-ratio: 1;
}

.day-cell {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  transition: transform var(--transition-fast);
}

.day-cell:hover {
  transform: scale(1.1);
}

.cell-done {
  background-color: var(--color-accent);
  color: #ffffff;
}

.cell-frozen {
  background-color: var(--color-info);
  color: #ffffff;
}

.cell-empty {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-muted);
}

.heatmap-legend-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-md);
  font-size: 11px;
  color: var(--color-text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-box {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.milestones-track-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.milestone-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
}

.milestone-card.milestone-done {
  background-color: var(--color-success-subtle);
  border-color: var(--color-success);
}

.ms-status-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}
.milestone-done .ms-status-icon {
  background-color: var(--color-success);
  color: #ffffff;
}

.ms-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ms-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
}

.ms-bar-bg {
  height: 6px;
  background-color: var(--color-border-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.ms-bar-fill {
  height: 100%;
  background-color: var(--color-accent);
  transition: width var(--transition-normal);
}
.milestone-done .ms-bar-fill {
  background-color: var(--color-success);
}

.ms-pct {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-secondary);
}

.calendar-limitation-notice {
  background-color: var(--color-warning-subtle);
  border: var(--border-width-regular) solid var(--color-warning);
  color: var(--color-warning);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  line-height: 1.6;
}
</style>
