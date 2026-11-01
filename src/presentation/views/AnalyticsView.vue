<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useHabitStore } from '../stores/useHabitStore';
import { useGoalStore } from '../stores/useGoalStore';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import { container } from '@/infrastructure/di/container';
import type { ObstacleLog } from '@/domain/entities/ObstacleLog';
import AppIcon from '../components/common/AppIcon.vue';
import SolarHeatmapYear from '../components/analytics/SolarHeatmapYear.vue';
import ObstacleAnalysisSection from '../components/analytics/ObstacleAnalysisSection.vue';
import PeriodicReviewSection from '../components/analytics/PeriodicReviewSection.vue';

type AnalyticsTab = 'heatmap' | 'obstacles' | 'reviews' | 'habits';

const habitStore = useHabitStore();
const goalStore = useGoalStore();
const { effectiveTodayIso, localizeDigits } = usePersianCalendar();

const activeTab = ref<AnalyticsTab>('heatmap');
const allObstacles = ref<ObstacleLog[]>([]);
const toastMessage = ref('');

const loadData = async () => {
  await Promise.all([
    habitStore.loadHabits(),
    goalStore.loadGoals()
  ]);

  for (const h of habitStore.habits) {
    await habitStore.loadLogsForHabit(h.id);
  }

  // تجمیع کلیه موانع ثبت‌شده در تمام اهداف
  const obstaclesAcc: ObstacleLog[] = [];
  for (const g of goalStore.goals) {
    const logs = await container.goalRepo.findObstacleLogsByGoalId(g.id);
    obstaclesAcc.push(...logs);
  }
  allObstacles.value = obstaclesAcc;
};

onMounted(async () => {
  await loadData();
});

const handleActionExecuted = (msg: string) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
};

// گزارش‌های تحلیلی هر عادت برای تب چهارم
const habitReports = computed(() => {
  return habitStore.habits.map(h => {
    const analysis = habitStore.getStreakAnalysis(h, effectiveTodayIso.value);
    return {
      habit: h,
      analysis
    };
  });
});
</script>

<template>
  <div class="analytics-view-container">
    <header class="analytics-header">
      <div class="header-titles">
        <h2 class="view-title">آمار، تحلیل موانع و بازبینی‌ها</h2>
        <span class="view-subtitle">بینش‌های داده‌محور، نقشه گرمایی سالانه شمسی و تأمل دوره‌ای</span>
      </div>

      <!-- تب‌های چهارگانه ناوبری آنالیتیکس -->
      <nav class="analytics-tabs-nav" role="tablist">
        <button
          type="button"
          :class="['analytics-nav-tab', { active: activeTab === 'heatmap' }]"
          role="tab"
          :aria-selected="activeTab === 'heatmap'"
          @click="activeTab = 'heatmap'"
        >
          <AppIcon name="calendar" size="16" />
          <span>نقشه سالانه شمسی</span>
        </button>

        <button
          type="button"
          :class="['analytics-nav-tab', { active: activeTab === 'obstacles' }]"
          role="tab"
          :aria-selected="activeTab === 'obstacles'"
          @click="activeTab = 'obstacles'"
        >
          <AppIcon name="alert" size="16" />
          <span>تحلیل موانع و تصمیمات</span>
        </button>

        <button
          type="button"
          :class="['analytics-nav-tab', { active: activeTab === 'reviews' }]"
          role="tab"
          :aria-selected="activeTab === 'reviews'"
          @click="activeTab = 'reviews'"
        >
          <AppIcon name="edit" size="16" />
          <span>بازبینی‌های دوره‌ای</span>
        </button>

        <button
          type="button"
          :class="['analytics-nav-tab', { active: activeTab === 'habits' }]"
          role="tab"
          :aria-selected="activeTab === 'habits'"
          @click="activeTab = 'habits'"
        >
          <AppIcon name="flame" size="16" />
          <span>استمرار و نقاط عطف</span>
        </button>
      </nav>
    </header>

    <!-- پیام بازخورد اقدام -->
    <div v-if="toastMessage" class="action-toast-banner animate-slide-up">
      <AppIcon name="check" size="18" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- تب ۱: نقشه گرمایی سالانه شمسی -->
    <section v-if="activeTab === 'heatmap'" class="tab-content animate-fade-in">
      <SolarHeatmapYear />
    </section>

    <!-- تب ۲: تحلیل موانع و همبستگی با استریک -->
    <section v-else-if="activeTab === 'obstacles'" class="tab-content animate-fade-in">
      <ObstacleAnalysisSection
        :obstacles="allObstacles"
        @action-executed="handleActionExecuted"
      />
    </section>

    <!-- تب ۳: بازبینی‌های دوره‌ای (هفتگی/ماهانه) -->
    <section v-else-if="activeTab === 'reviews'" class="tab-content animate-fade-in">
      <PeriodicReviewSection />
    </section>

    <!-- تب ۴: تحلیل استریک و نقاط عطف عادات -->
    <section v-else-if="activeTab === 'habits'" class="tab-content animate-fade-in">
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
            <span class="track-title">نقاط عطف مسیر رفتار (Lally 2009):</span>
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

      <div v-else class="empty-habits-box">
        <p class="empty-hint">هنوز عادتی برای تحلیل آماری ثبت نشده است.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.analytics-view-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-2xl);
}

.analytics-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.view-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
}

.view-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ناوبری تب‌های آنالیتیکس */
.analytics-tabs-nav {
  display: flex;
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-lg);
  padding: 4px;
  gap: 4px;
  overflow-x: auto;
}

.analytics-nav-tab {
  flex: 1;
  min-width: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.analytics-nav-tab:hover {
  color: var(--color-text-primary);
}

.analytics-nav-tab.active {
  background-color: var(--color-bg-surface);
  color: var(--color-accent);
  box-shadow: var(--shadow-xs);
  font-weight: 700;
}

/* توست بازخورد اقدام */
.action-toast-banner {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

/* تب عادات */
.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

.report-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-habit-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.report-adherence {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-accent);
  background-color: var(--color-accent-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.streaks-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  text-align: center;
}

.streak-box {
  display: flex;
  flex-direction: column;
}

.streak-val {
  font-size: var(--font-size-md);
  font-weight: 800;
  color: var(--color-text-primary);
}

.streak-lbl {
  font-size: 10px;
  color: var(--color-text-muted);
}

.weakest-day-banner {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
  font-size: 11px;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.milestones-track {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-title {
  font-size: 11px;
  color: var(--color-text-muted);
}

.milestones-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ms-chip {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 3px;
}

.ms-chip.chip-reached {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}

.empty-habits-box {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
</style>
