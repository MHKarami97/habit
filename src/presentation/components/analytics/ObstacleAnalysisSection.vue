<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { ObstacleLog } from '@/domain/entities/ObstacleLog';
import {
  ObstacleAnalyticsService,
  type ActionableRecommendation
} from '@/domain/services/ObstacleAnalyticsService';
import { useHabitStore } from '../../stores/useHabitStore';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppIcon from '../common/AppIcon.vue';
import AppButton from '../common/AppButton.vue';
import AppEmptyState from '../common/AppEmptyState.vue';

const props = defineProps<{
  obstacles: readonly ObstacleLog[];
}>();

const emit = defineEmits<{
  (e: 'action-executed', message: string): void;
}>();

const router = useRouter();
const habitStore = useHabitStore();
const goalStore = useGoalStore();
const { localizeDigits } = usePersianCalendar();

// توزیع فراوانی موانع
const distribution = computed(() => {
  return ObstacleAnalyticsService.calculateDistribution(props.obstacles);
});

// همبستگی موانع با افت استریک
const streakCorrelations = computed(() => {
  return ObstacleAnalyticsService.calculateStreakDropCorrelations({
    obstacles: props.obstacles,
    habits: habitStore.habits,
    habitLogsMap: habitStore.habitLogsMap
  });
});

// پیشنهادهای داده‌محور همراه با دکمه اقدام صریح
const recommendations = computed(() => {
  const activeGoalsCount = goalStore.goals.filter(g => g.status === 'active' && !g.isArchived).length;
  return ObstacleAnalyticsService.generateActionableRecommendations({
    obstacles: props.obstacles,
    correlations: streakCorrelations.value,
    activeGoalsCount,
    habits: habitStore.habits
  });
});

// اجرای اقدام صریح پیشنهادها
const handleExecuteAction = async (rec: ActionableRecommendation) => {
  if (rec.type === 'move_to_morning' && rec.actionPayload.habitId) {
    const habit = habitStore.habits.find(h => h.id === rec.actionPayload.habitId);
    if (habit) {
      await habitStore.updateHabitReminders(habit.id, [rec.actionPayload.suggestedReminderTime || '07:30']);
      emit('action-executed', `ساعت یادآور «${habit.title}» به ۰۷:۳۰ صبح منتقل شد.`);
    }
  } else if (rec.type === 'create_if_then_plan') {
    router.push('/guide?topic=if_then_plans');
  } else if (rec.type === 'pause_low_priority_goals') {
    router.push('/goals');
  } else if (rec.type === 'tiny_habit_downscale') {
    router.push('/habits');
  }
};
</script>

<template>
  <div class="obstacle-analytics-container">
    <header class="section-heading">
      <div>
        <h3 class="heading-title">تحلیل موانع و همبستگی با استریک</h3>
        <span class="heading-desc">
          الگوهای تکرارشونده و پیشنهادهای رفتاری داده‌محور برای رفع انسدادها
        </span>
      </div>
    </header>

    <div v-if="obstacles.length > 0" class="analytics-layout-grid">
      <!-- ستون ۱: نمودار توزیع فراوانی موانع -->
      <section class="card-box distribution-card">
        <h4 class="card-subtitle">
          <AppIcon name="alert" size="16" class="text-warning" />
          پرتکرارترین موانع ثبت‌شده
        </h4>

        <div class="distribution-bars">
          <div
            v-for="item in distribution"
            :key="item.category"
            class="distribution-row"
          >
            <div class="row-header">
              <span class="category-name">{{ item.label }}</span>
              <span class="category-count">
                {{ localizeDigits(item.count) }} مورد ({{ localizeDigits(item.percentage) }}٪)
              </span>
            </div>

            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${item.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- ستون ۲: همبستگی نوع مانع با افت استریک -->
      <section class="card-box correlation-card">
        <h4 class="card-subtitle">
          <AppIcon name="flame" size="16" class="text-accent" />
          شدت آسیب به استریک عادات
        </h4>

        <div class="correlation-list">
          <div
            v-for="corr in streakCorrelations"
            :key="corr.category"
            class="correlation-item"
          >
            <div class="corr-meta">
              <strong class="corr-title">{{ corr.label }}</strong>
              <span :class="['impact-tag', `impact-${corr.dropImpactLevel}`]">
                {{ corr.dropImpactLevel === 'high' ? 'آسیب بالا' : corr.dropImpactLevel === 'medium' ? 'آسیب متوسط' : 'آسیب کم' }}
              </span>
            </div>
            <p class="corr-desc">
              در {{ localizeDigits(corr.breakPercentage) }}٪ از روزهای افت یا گسست استریک، این مانع فعال بوده است ({{ localizeDigits(corr.breakCount) }} مرتبه).
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- بخش پیشنهادهای داده‌محور همراه با دکمه اقدام صریح -->
    <section v-if="recommendations.length > 0" class="recommendations-box">
      <h4 class="rec-heading">
        <AppIcon name="info" size="18" class="text-accent" />
        پیشنهادهای داده‌محور و تصمیمات رفتاری
      </h4>

      <div class="recommendations-grid">
        <article
          v-for="rec in recommendations"
          :key="rec.id"
          class="recommendation-card"
        >
          <div class="rec-content">
            <h5 class="rec-title">{{ rec.title }}</h5>
            <p class="rec-insight">{{ rec.insight }}</p>
            <p class="rec-suggestion">{{ rec.suggestion }}</p>
            <div class="rec-science-note">
              <span>{{ rec.scientificNote }}</span>
            </div>
          </div>

          <div class="rec-action-footer">
            <AppButton
              variant="primary"
              size="sm"
              class="rec-btn"
              @click="handleExecuteAction(rec)"
            >
              {{ rec.actionLabel }}
            </AppButton>
          </div>
        </article>
      </div>
    </section>

    <!-- حالت خالی وقتی مانعی ثبت نشده است -->
    <AppEmptyState
      v-else
      title="هنوز مانعی ثبت نشده است"
      description="با ثبت موانع در اهداف یا هنگام عدم اجرای عادات، الگوی توزیع و پیشنهادهای مداخله هوشمند در این بخش به صورت خودکار ظاهر خواهند شد."
      icon-name="check"
    />
  </div>
</template>

<style scoped>
.obstacle-analytics-container {
  margin-bottom: var(--spacing-lg);
}

.section-heading {
  margin-bottom: var(--spacing-md);
}

.heading-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.heading-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.analytics-layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

@media (max-width: 768px) {
  .analytics-layout-grid {
    grid-template-columns: 1fr;
  }
}

.card-box {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.card-subtitle {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 0 var(--spacing-md) 0;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.distribution-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-header {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
}

.category-name {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.category-count {
  color: var(--color-text-muted);
}

.progress-track {
  width: 100%;
  height: 8px;
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-warning);
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.correlation-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.correlation-item {
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.corr-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.corr-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
}

.impact-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.impact-high {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
}

.impact-medium {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}

.impact-low {
  background-color: var(--color-bg-surface);
  color: var(--color-text-muted);
}

.corr-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin: 0;
}

/* بخش پیشنهادهای داده‌محور */
.recommendations-box {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.rec-heading {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 0 var(--spacing-md) 0;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.recommendation-card {
  background-color: var(--color-accent-subtle);
  border: var(--border-width-regular) solid var(--color-accent);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.rec-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-accent);
  margin: 0 0 var(--spacing-xxs) 0;
}

.rec-insight {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
}

.rec-suggestion {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 6px 0;
}

.rec-science-note {
  font-size: 10px;
  color: var(--color-text-muted);
  font-style: italic;
  border-top: var(--border-width-hairline) dashed var(--color-border-subtle);
  padding-top: 4px;
}

.rec-action-footer {
  display: flex;
  justify-content: flex-end;
}

.rec-btn {
  width: 100%;
}
</style>
