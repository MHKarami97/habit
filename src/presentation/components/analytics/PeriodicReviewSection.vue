<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import type { PeriodicReviewType } from '@/domain/entities/PeriodicReview';
import { usePeriodicReviewStore } from '../../stores/usePeriodicReviewStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppButton from '../common/AppButton.vue';
import AppTextarea from '../common/AppTextarea.vue';
import AppIcon from '../common/AppIcon.vue';
import AppProgressRing from '../common/AppProgressRing.vue';

const reviewStore = usePeriodicReviewStore();
const { effectiveTodayIso, localizeDigits, formatShortDate } = usePersianCalendar();

const activeTab = ref<PeriodicReviewType>('weekly');
const isSubmitting = ref(false);
const saveSuccessMessage = ref('');
const expandedReviewId = ref<string | null>(null);

// فرم بازبینی دوره جاری
const whatWorked = ref('');
const whatDidntWork = ref('');
const primaryObstacle = ref('');
const actionPlan = ref('');

// محاسبه اطلاعات و آمارهای دوره فعلی
const currentPeriodComputed = computed(() => {
  return reviewStore.computePeriodData(activeTab.value, effectiveTodayIso.value);
});

// بازبینی موجود برای این دوره (اگر قبلاً ثبت شده باشد)
const existingReview = computed(() => {
  return reviewStore.reviews.find(
    r => r.type === activeTab.value && r.periodKey === currentPeriodComputed.value.periodKey
  );
});

// با تغییر تب یا بارگذاری، اگر بازبینی قبلاً ثبت شده بود فیلدها پر شوند
watch(
  [activeTab, existingReview],
  () => {
    if (existingReview.value) {
      whatWorked.value = existingReview.value.whatWorked;
      whatDidntWork.value = existingReview.value.whatDidntWork;
      primaryObstacle.value = existingReview.value.primaryObstacle;
      actionPlan.value = existingReview.value.actionPlan;
    } else {
      whatWorked.value = '';
      whatDidntWork.value = '';
      primaryObstacle.value = '';
      actionPlan.value = '';
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await reviewStore.loadReviews();
});

// ذخیره بازبینی در دیتابیس
const handleSubmitReview = async () => {
  if (!whatWorked.value.trim() && !whatDidntWork.value.trim() && !actionPlan.value.trim()) {
    return;
  }

  isSubmitting.value = true;
  saveSuccessMessage.value = '';

  try {
    const data = currentPeriodComputed.value;
    await reviewStore.saveReview({
      id: existingReview.value?.id,
      type: activeTab.value,
      periodKey: data.periodKey,
      solarYear: data.solarYear,
      solarPeriod: data.solarPeriod,
      periodLabel: data.periodLabel,
      startDateIso: data.startDateIso,
      endDateIso: data.endDateIso,
      whatWorked: whatWorked.value,
      whatDidntWork: whatDidntWork.value,
      primaryObstacle: primaryObstacle.value,
      actionPlan: actionPlan.value,
      adherenceRate: data.adherenceRate,
      completedHabitsCount: data.completedHabitsCount,
      totalExpectedHabits: data.totalExpectedHabits,
      activeGoalsCount: data.activeGoalsCount
    });

    saveSuccessMessage.value = 'بازبینی دوره‌ای با موفقیت در دستگاه شما ذخیره شد.';
    setTimeout(() => {
      saveSuccessMessage.value = '';
    }, 4000);
  } finally {
    isSubmitting.value = false;
  }
};

const pastReviews = computed(() => {
  return reviewStore.reviews.filter(r => r.type === activeTab.value);
});

const toggleExpand = (id: string) => {
  expandedReviewId.value = expandedReviewId.value === id ? null : id;
};

const handleDelete = async (id: string) => {
  if (confirm('آیا از حذف این بازبینی اطمینان دارید؟')) {
    await reviewStore.deleteReview(id);
  }
};
</script>

<template>
  <div class="periodic-review-container">
    <header class="review-header">
      <div class="header-titles">
        <h3 class="review-title">بازبینی دوره‌ای و تأمل ساختارمند</h3>
        <span class="review-subtitle">
          توقف منظم برای ارزیابی پیشرفت، شناسایی گلوگاه‌ها و تعهد به دوره بعد
        </span>
      </div>

      <!-- سوئیچر بازبینی هفتگی یا ماهانه -->
      <div class="review-type-switcher">
        <button
          type="button"
          :class="['type-btn', { active: activeTab === 'weekly' }]"
          @click="activeTab = 'weekly'"
        >
          بازبینی هفتگی
        </button>
        <button
          type="button"
          :class="['type-btn', { active: activeTab === 'monthly' }]"
          @click="activeTab = 'monthly'"
        >
          بازبینی ماهانه
        </button>
      </div>
    </header>

    <!-- کارت دوره جاری و محاسبات آماری خودکار -->
    <section class="current-period-card">
      <div class="period-meta-col">
        <span class="period-tag">{{ activeTab === 'weekly' ? 'هفته جاری' : 'ماه جاری' }}</span>
        <h4 class="period-name">{{ currentPeriodComputed.periodLabel }}</h4>
        <span class="period-dates">
          از {{ formatShortDate(currentPeriodComputed.startDateIso) }} تا {{ formatShortDate(currentPeriodComputed.endDateIso) }}
        </span>

        <div class="period-stats-row">
          <div class="stat-item">
            <span class="stat-number">{{ localizeDigits(currentPeriodComputed.completedHabitsCount) }}</span>
            <span class="stat-text">عادات تکمیل‌شده</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ localizeDigits(currentPeriodComputed.totalExpectedHabits) }}</span>
            <span class="stat-text">کل انتظارات دوره</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ localizeDigits(currentPeriodComputed.activeGoalsCount) }}</span>
            <span class="stat-text">اهداف فعال</span>
          </div>
        </div>
      </div>

      <div class="period-ring-col">
        <AppProgressRing
          :percentage="currentPeriodComputed.adherenceRate"
          :size="72"
          :stroke-width="7"
        />
        <span class="ring-caption">نرخ پایبندی کل</span>
      </div>
    </section>

    <!-- فرم سوالات انعکاسی و تأمل دوره -->
    <form class="reflection-form-card" @submit.prevent="handleSubmitReview">
      <h4 class="form-title">
        <AppIcon name="edit" size="18" class="text-accent" />
        ثبت بازبینی {{ currentPeriodComputed.periodLabel }}
      </h4>

      <p v-if="saveSuccessMessage" class="success-banner animate-slide-up">
        <AppIcon name="check" size="16" />
        {{ saveSuccessMessage }}
      </p>

      <div class="questions-stack">
        <!-- سوال ۱: چه کار کرد؟ -->
        <div class="question-block">
          <label class="question-label">
            ۱. چه کارهایی در این دوره به خوبی پیش رفت و مایه افتخار است؟
          </label>
          <AppTextarea
            v-model="whatWorked"
            placeholder="مثلاً: بیدار شدن در ساعت ۶ صبح تثبیت شد؛ مطالعه ۳ فصل کتاب تمام شد..."
            :rows="2"
          />
        </div>

        <!-- سوال ۲: چه کار نکرد؟ -->
        <div class="question-block">
          <label class="question-label">
            ۲. چه کارهایی طبق برنامه پیش نرفت و چرا؟
          </label>
          <AppTextarea
            v-model="whatDidntWork"
            placeholder="مثلاً: در روزهای سه‌شنبه و چهارشنبه به دلیل خستگی کار ورزش لغو شد..."
            :rows="2"
          />
        </div>

        <!-- سوال ۳: مانع اصلی -->
        <div class="question-block">
          <label class="question-label">
            ۳. مانع اصلی در این دوره چه بود؟
          </label>
          <AppTextarea
            v-model="primaryObstacle"
            placeholder="مثلاً: وقت‌گذرانی با گوشی بعد از ساعت ۲۲..."
            :rows="2"
          />
        </div>

        <!-- سوال ۴: تصمیم رفتاری -->
        <div class="question-block">
          <label class="question-label">
            ۴. تصمیم رفتاری و تعهد کلیدی برای دوره بعد چیست؟
          </label>
          <AppTextarea
            v-model="actionPlan"
            placeholder="مثلاً: قرار دادن گوشی بیرون از اتاق خواب از ساعت ۲۱:۳۰ به عنوان برنامه اگر-آنگاه..."
            :rows="2"
          />
        </div>
      </div>

      <div class="form-actions">
        <AppButton
          variant="primary"
          size="md"
          type="submit"
          :loading="isSubmitting"
        >
          {{ existingReview ? 'به‌روزرسانی بازبینی' : 'ثبت قطعی بازبینی در دستگاه' }}
        </AppButton>
      </div>
    </form>

    <!-- تاریخچه بازبینی‌های گذشته -->
    <section v-if="pastReviews.length > 0" class="history-section">
      <h4 class="history-title">
        <AppIcon name="clock" size="18" />
        تاریخچه بازبینی‌های {{ activeTab === 'weekly' ? 'هفتگی' : 'ماهانه' }} گذشته
      </h4>

      <div class="reviews-history-list">
        <article
          v-for="rev in pastReviews"
          :key="rev.id"
          class="history-card"
        >
          <header class="history-card-header" @click="toggleExpand(rev.id)">
            <div class="history-title-row">
              <strong class="history-period-label">{{ rev.periodLabel }}</strong>
              <span class="history-adherence-pill">
                {{ localizeDigits(rev.adherenceRate) }}٪ پایبندی
              </span>
            </div>

            <div class="history-header-actions">
              <span class="history-date-text">
                {{ formatShortDate(rev.startDateIso) }} تا {{ formatShortDate(rev.endDateIso) }}
              </span>
              <button
                type="button"
                class="delete-btn touch-target"
                title="حذف بازبینی"
                @click.stop="handleDelete(rev.id)"
              >
                <AppIcon name="trash" size="14" />
              </button>
            </div>
          </header>

          <!-- محتوای بازشونده بازبینی -->
          <div v-if="expandedReviewId === rev.id" class="history-card-body animate-slide-up">
            <div v-if="rev.whatWorked" class="review-qa-item">
              <span class="qa-q">نقاط قوت و دستاوردها:</span>
              <p class="qa-a">{{ rev.whatWorked }}</p>
            </div>
            <div v-if="rev.whatDidntWork" class="review-qa-item">
              <span class="qa-q">چالش‌ها و عدم تحقق‌ها:</span>
              <p class="qa-a">{{ rev.whatDidntWork }}</p>
            </div>
            <div v-if="rev.primaryObstacle" class="review-qa-item">
              <span class="qa-q">مانع اصلی:</span>
              <p class="qa-a">{{ rev.primaryObstacle }}</p>
            </div>
            <div v-if="rev.actionPlan" class="review-qa-item">
              <span class="qa-q">تصمیم رفتاری و تعهد:</span>
              <p class="qa-a commitment-text">{{ rev.actionPlan }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.periodic-review-container {
  margin-bottom: var(--spacing-lg);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.review-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.review-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.review-type-switcher {
  display: flex;
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-full);
  padding: 3px;
  gap: 3px;
}

.type-btn {
  background: transparent;
  border: none;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.type-btn.active {
  background-color: var(--color-bg-surface);
  color: var(--color-accent);
  box-shadow: var(--shadow-xs);
}

/* کارت دوره جاری */
.current-period-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 580px) {
  .current-period-card {
    flex-direction: column;
    align-items: flex-start;
  }
}

.period-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  background-color: var(--color-accent-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.period-name {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-text-primary);
  margin: var(--spacing-xxs) 0;
}

.period-dates {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.period-stats-row {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: var(--font-size-md);
  font-weight: 800;
  color: var(--color-text-primary);
}

.stat-text {
  font-size: 11px;
  color: var(--color-text-muted);
}

.period-ring-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ring-caption {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* کارت فرم تأمل */
.reflection-form-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.form-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 0 var(--spacing-md) 0;
}

.success-banner {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.questions-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.question-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.question-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-md);
}

/* تاریخچه بازبینی‌ها */
.history-section {
  margin-top: var(--spacing-lg);
}

.history-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0 0 var(--spacing-sm) 0;
}

.reviews-history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.history-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

.history-card-header {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: var(--color-bg-surface-soft);
}

.history-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.history-period-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
}

.history-adherence-pill {
  font-size: 10px;
  font-weight: 700;
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.history-header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.history-date-text {
  font-size: 11px;
  color: var(--color-text-muted);
}

.delete-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
}

.delete-btn:hover {
  color: var(--color-danger);
}

.history-card-body {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
}

.review-qa-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qa-q {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
}

.qa-a {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.commitment-text {
  color: var(--color-accent);
  font-weight: 600;
}
</style>
