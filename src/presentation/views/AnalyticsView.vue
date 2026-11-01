<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useHabitStore } from '../stores/useHabitStore';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import AppIcon from '../components/common/AppIcon.vue';

const habitStore = useHabitStore();
const { effectiveTodayIso, localizeDigits, formatShortDate } = usePersianCalendar();

onMounted(async () => {
  await habitStore.loadHabits();
  for (const h of habitStore.habits) {
    await habitStore.loadLogsForHabit(h.id);
  }
});

// محاسبه کل عادات و استریک‌ها
const habitReports = computed(() => {
  return habitStore.habits.map(h => {
    const analysis = habitStore.getStreakAnalysis(h, effectiveTodayIso.value);
    return {
      habit: h,
      analysis
    };
  });
});

// تولید ۶۰ روز گذشته برای هیت‌مپ تقویم
const heatmapDays = computed(() => {
  const days: { dateIso: string; completedCount: number; level: number }[] = [];
  const base = new Date();

  for (let i = 59; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // شمارش تعداد لاگ‌های موفق در این تاریخ
    let count = 0;
    habitStore.habitLogsMap.forEach(logs => {
      const match = logs.find(l => l.date === dateIso);
      if (match?.isCompleted) count++;
    });

    let level = 0;
    if (count === 1) level = 1;
    else if (count === 2) level = 2;
    else if (count >= 3) level = 3;

    days.push({
      dateIso,
      completedCount: count,
      level
    });
  }

  return days;
});
</script>

<template>
  <div class="analytics-view-container">
    <div class="analytics-header">
      <h2 class="view-title">آمار و تحلیل پایبندی</h2>
      <span class="view-subtitle">نقشه گرمایی و استمرار رفتارها</span>
    </div>

    <!-- نقشه گرمایی ۶۰ روز اخیر -->
    <section class="analytics-card">
      <div class="card-header">
        <h3 class="card-title">نقشه گرمایی فعالیت (Heatmap)</h3>
        <span class="card-hint">۶۰ روز اخیر</span>
      </div>

      <div class="heatmap-grid">
        <div
          v-for="d in heatmapDays"
          :key="d.dateIso"
          :class="['heatmap-cell', `level-${d.level}`]"
          :title="`${formatShortDate(d.dateIso)}: ${localizeDigits(d.completedCount)} عادت انجام‌شده`"
        />
      </div>

      <div class="heatmap-legend">
        <span class="legend-text">کمتر</span>
        <div class="heatmap-cell level-0" />
        <div class="heatmap-cell level-1" />
        <div class="heatmap-cell level-2" />
        <div class="heatmap-cell level-3" />
        <span class="legend-text">بیشتر</span>
      </div>
    </section>

    <!-- گزارش تحلیلی به تفکیک هر عادت -->
    <section class="habits-analytics-section">
      <h3 class="sub-heading">تحلیل استریک و نقاط عطف هر عادت</h3>

      <div v-if="habitReports.length > 0" class="reports-grid">
        <article
          v-for="report in habitReports"
          :key="report.habit.id"
          class="report-card"
        >
          <header class="report-header">
            <h4 class="report-habit-title">{{ report.habit.title }}</h4>
            <span class="report-adherence">
              {{ localizeDigits(report.analysis.adherenceRate) }}٪ نرخ پایبندی
            </span>
          </header>

          <div class="streaks-row">
            <div class="streak-box">
              <span class="streak-val">{{ localizeDigits(report.analysis.currentStreak) }}</span>
              <span class="streak-lbl">استریک فعلی (روز)</span>
            </div>
            <div class="streak-box">
              <span class="streak-val">{{ localizeDigits(report.analysis.longestStreak) }}</span>
              <span class="streak-lbl">بیشترین استریک</span>
            </div>
            <div class="streak-box">
              <span class="streak-val">{{ localizeDigits(report.analysis.totalCompletedDays) }}</span>
              <span class="streak-lbl">روزهای تکمیل‌شده</span>
            </div>
          </div>

          <!-- ضعیف‌ترین روز هفته -->
          <div v-if="report.analysis.weakestDay" class="weakest-day-banner">
            <AppIcon name="alert" size="14" />
            <span>
              نقطه حساس: روزهای <strong>{{ report.analysis.weakestDay.dayName }}</strong> کمترین پایبندی را داشته‌اید ({{ localizeDigits(report.analysis.weakestDay.rate) }}٪).
            </span>
          </div>

          <!-- نقاط عطف ۷، ۲۱ (میان‌راه) و ۶۶ (تثبیت) -->
          <div class="milestones-track">
            <span class="track-title">نقاط عطف مسیر رفتار:</span>
            <div class="milestones-chips">
              <div
                v-for="ms in report.analysis.milestones"
                :key="ms.targetDays"
                :class="['ms-chip', { 'chip-reached': ms.isReached }]"
              >
                <AppIcon v-if="ms.isReached" name="check" size="12" />
                <span>{{ ms.title }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <p v-else class="empty-hint">هنوز عادتی برای تحلیل آماری ثبت نشده است.</p>
    </section>
  </div>
</template>

<style scoped>
.analytics-view-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-2xl);
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

.analytics-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.card-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18px, 1fr));
  gap: 4px;
  padding: var(--spacing-xs) 0;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  transition: transform var(--transition-fast);
}
.heatmap-cell:hover {
  transform: scale(1.2);
}

.level-0 {
  background-color: var(--color-bg-surface-elevated);
}
.level-1 {
  background-color: var(--color-accent-subtle);
}
.level-2 {
  background-color: var(--color-accent);
  opacity: 0.65;
}
.level-3 {
  background-color: var(--color-accent);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: var(--spacing-xs);
}

.legend-text {
  font-size: 11px;
  color: var(--color-text-muted);
  margin: 0 4px;
}

.heatmap-legend .heatmap-cell {
  width: 14px;
  height: 14px;
}

.habits-analytics-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.sub-heading {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.reports-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.report-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-habit-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.report-adherence {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-success);
}

.streaks-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
}

.streak-box {
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.streak-val {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-text-primary);
}

.streak-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
}

.weakest-day-banner {
  background-color: var(--color-warning-subtle);
  color: var(--color-text-primary);
  border-radius: var(--radius-xs);
  padding: 6px var(--spacing-sm);
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.milestones-track {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.track-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.milestones-chips {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.ms-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-muted);
  font-size: 11px;
}

.ms-chip.chip-reached {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
  font-weight: 700;
}

.empty-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
