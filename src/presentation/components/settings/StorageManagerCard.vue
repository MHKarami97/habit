<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { StorageManagerService, type StorageQuotaInfo } from '@/infrastructure/storage/StorageManagerService';
import { IndexedDBHealthService, type DatabaseHealthReport } from '@/infrastructure/db/IndexedDBHealthService';
import { LoadBenchmarkRunner, type BenchmarkResult } from '@/infrastructure/benchmarks/LoadBenchmarkRunner';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppButton from '../common/AppButton.vue';
import AppProgressBar from '../common/AppProgressBar.vue';
import AppIcon from '../common/AppIcon.vue';

const { localizeDigits } = usePersianCalendar();

const storageInfo = ref<StorageQuotaInfo | null>(null);
const healthReport = ref<DatabaseHealthReport | null>(null);
const isPersisting = ref(false);
const isRepairing = ref(false);
const isRunningBenchmark = ref(false);
const isCleaningBenchmark = ref(false);
const benchmarkProgress = ref<{ stage: string; percent: number } | null>(null);
const benchmarkResult = ref<BenchmarkResult | null>(null);
const actionFeedback = ref('');

const loadMetrics = async () => {
  const [sInfo, hReport] = await Promise.all([
    StorageManagerService.getStorageInfo(),
    IndexedDBHealthService.checkHealth()
  ]);
  storageInfo.value = sInfo;
  healthReport.value = hReport;
};

onMounted(async () => {
  await loadMetrics();
});

const showFeedback = (msg: string) => {
  actionFeedback.value = msg;
  setTimeout(() => {
    actionFeedback.value = '';
  }, 4000);
};

const handleRequestPersistence = async () => {
  isPersisting.value = true;
  try {
    const granted = await StorageManagerService.requestPersistence();
    await loadMetrics();
    if (granted) {
      showFeedback('ذخیره‌سازی پایدار فعال شد؛ داده‌های شما از پاک‌سازی خودکار مرورگر در امان است.');
    } else {
      showFeedback('مرورگر اجازه ذخیره‌سازی دائمی را رد کرد (برخی مرورگرها نیاز به بوکمارک یا نصب PWA دارند).');
    }
  } finally {
    isPersisting.value = false;
  }
};

const handleEmergencyRepair = async () => {
  isRepairing.value = true;
  try {
    const success = await IndexedDBHealthService.emergencyRepair();
    await loadMetrics();
    if (success) {
      showFeedback('پایگاه داده با موفقیت بازنشانی و بررسی سلامت مجدد شد.');
    } else {
      showFeedback('خطا در تعمیر پایگاه داده.');
    }
  } finally {
    isRepairing.value = false;
  }
};

const handleRunBenchmark = async () => {
  isRunningBenchmark.value = true;
  benchmarkResult.value = null;
  benchmarkProgress.value = { stage: 'آغاز ارزیابی بارگذاری...', percent: 5 };

  try {
    const res = await LoadBenchmarkRunner.runLoadTest({
      goalsCount: 500,
      habitsCount: 300,
      logsCount: 50000,
      onProgress: (stage, percent) => {
        benchmarkProgress.value = { stage, percent };
      }
    });

    benchmarkResult.value = res;
    await loadMetrics();
    showFeedback('تست بار ۵۰٬۰۰۰ لاگ با موفقیت به اتمام رسید.');
  } catch (err: unknown) {
    showFeedback(`خطا در اجرای تست بار: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    isRunningBenchmark.value = false;
    benchmarkProgress.value = null;
  }
};

const handleCleanupBenchmark = async () => {
  isCleaningBenchmark.value = true;
  try {
    const res = await LoadBenchmarkRunner.cleanupBenchmarkData();
    benchmarkResult.value = null;
    await loadMetrics();
    showFeedback(`داده‌های تستی با موفقیت حذف شدند (${localizeDigits(res.deletedLogs)} لاگ و ${localizeDigits(res.deletedGoals)} هدف).`);
  } finally {
    isCleaningBenchmark.value = false;
  }
};
</script>

<template>
  <section class="storage-card">
    <header class="card-header">
      <div class="header-titles">
        <h3 class="card-title">
          <AppIcon name="shield" size="18" class="text-accent" />
          مدیریت سهمیه حافظه و سلامت پایگاه داده (IndexedDB)
        </h3>
        <span class="card-subtitle">
          پایش ظرفیت دیسک با StorageManager API و تضمین امنیت داده‌ها در برابر پاک‌سازی مرورگر
        </span>
      </div>

      <span
        v-if="storageInfo"
        :class="['persistence-badge', storageInfo.isPersisted ? 'badge-persisted' : 'badge-regular']"
      >
        <AppIcon :name="storageInfo.isPersisted ? 'check' : 'alert'" size="14" />
        {{ storageInfo.isPersisted ? 'پایدار و غیرقابل حذف' : 'عادی (در معرض پاک‌سازی مرورگر)' }}
      </span>
    </header>

    <div v-if="actionFeedback" class="feedback-banner animate-slide-up">
      <AppIcon name="info" size="16" />
      <span>{{ actionFeedback }}</span>
    </div>

    <!-- اطلاعات مصرف حافظه -->
    <div v-if="storageInfo && storageInfo.isSupported" class="storage-metrics-panel">
      <div class="storage-row-info">
        <div class="metric-item">
          <span class="metric-label">حجم مصرفی داده‌ها:</span>
          <strong class="metric-val">{{ storageInfo.usageFormatted }}</strong>
        </div>
        <div class="metric-item">
          <span class="metric-label">سهمیه کل اختصاص‌یافته:</span>
          <strong class="metric-val">{{ storageInfo.quotaFormatted }}</strong>
        </div>
        <div class="metric-item">
          <span class="metric-label">درصد استفاده:</span>
          <strong class="metric-val">{{ localizeDigits(storageInfo.percentUsed) }}٪</strong>
        </div>
      </div>

      <div class="storage-progress-bar-wrap">
        <AppProgressBar :percentage="storageInfo.percentUsed" />
      </div>

      <p class="storage-notice">
        <strong>توجه امنیتی:</strong> در مرورگرهای موبایل اگر حافظه دستگاه پر شود، مرورگر ممکن است دیتابیس‌های سایت‌های معمولی را بدون هشدار پاک کند. فعال‌سازی ذخیره‌سازی پایدار (persist) برنامه شما را در فهرست داده‌های محافظت‌شده قرار می‌دهد.
      </p>

      <div v-if="!storageInfo.isPersisted" class="persistence-action-row">
        <AppButton
          variant="secondary"
          size="sm"
          :loading="isPersisting"
          @click="handleRequestPersistence"
        >
          درخواست ماندگاری داده (persist)
        </AppButton>
      </div>
    </div>

    <!-- وضعیت سلامت دیتابیس و ریکاوری خطای احتمالی -->
    <div v-if="healthReport" class="health-report-panel">
      <div class="health-status-row">
        <span class="health-label">وضعیت ارتباط با IndexedDB:</span>
        <span :class="['health-pill', healthReport.isHealthy ? 'pill-healthy' : 'pill-warning']">
          <AppIcon :name="healthReport.isHealthy ? 'check' : 'alert'" size="14" />
          {{ healthReport.statusMessage }}
        </span>
      </div>

      <div v-if="!healthReport.isHealthy" class="repair-action-row">
        <AppButton
          variant="danger"
          size="sm"
          :loading="isRepairing"
          @click="handleEmergencyRepair"
        >
          تعمیر اضطراری و اتصال مجدد پایگاه داده
        </AppButton>
      </div>
    </div>

    <!-- جعبه ارزیابی بارگذاری و عملکرد سنگین (Benchmark) -->
    <div class="benchmark-suite-panel">
      <div class="benchmark-header">
        <div>
          <h4 class="bench-title">ابزار ارزیابی بار سنگین (Stress Benchmark)</h4>
          <span class="bench-desc">
            تزریق ۵۰۰ هدف، ۳۰۰ عادت و ۵۰٬۰۰۰ لاگ برای اثبات عملکرد O(1) و حفظ فریم‌ریت ۶۰fps
          </span>
        </div>

        <div class="bench-actions">
          <AppButton
            variant="secondary"
            size="sm"
            :loading="isRunningBenchmark"
            @click="handleRunBenchmark"
          >
            اجرای تست بارگذاری (۵۰K لاگ)
          </AppButton>

          <AppButton
            v-if="benchmarkResult"
            variant="outline"
            size="sm"
            :loading="isCleaningBenchmark"
            @click="handleCleanupBenchmark"
          >
            پاک‌سازی داده‌های تست
          </AppButton>
        </div>
      </div>

      <!-- نوار پیشرفت حین تست -->
      <div v-if="benchmarkProgress" class="benchmark-progress-box animate-slide-up">
        <span class="progress-stage-text">{{ benchmarkProgress.stage }}</span>
        <AppProgressBar :percentage="benchmarkProgress.percent" />
      </div>

      <!-- نتایج ارزیابی عملکرد -->
      <div v-if="benchmarkResult" class="benchmark-result-card animate-slide-up">
        <div class="result-badge-row">
          <span :class="['result-badge', benchmarkResult.passedBudget ? 'badge-pass' : 'badge-fail']">
            <AppIcon :name="benchmarkResult.passedBudget ? 'check' : 'alert'" size="16" />
            {{ benchmarkResult.passedBudget ? 'انطباق ۱۰۰٪ با بودجه عملکردی' : 'فراتر از بودجه' }}
          </span>
          <span class="result-summary-text">{{ benchmarkResult.message }}</span>
        </div>

        <div class="benchmark-grid-metrics">
          <div class="bench-stat-card">
            <span class="bench-stat-val">{{ localizeDigits(benchmarkResult.todayQueryTimeMs) }} ms</span>
            <span class="bench-stat-lbl">زمان کوئری صفحه امروز</span>
            <span class="budget-tag">بودجه: زیر ۱۲۰ms</span>
          </div>

          <div class="bench-stat-card">
            <span class="bench-stat-val">{{ localizeDigits(benchmarkResult.habitHistoryQueryTimeMs) }} ms</span>
            <span class="bench-stat-lbl">جستجوی تاریخچه میان ۵۰K لاگ</span>
            <span class="budget-tag">بودجه: زیر ۸۰ms</span>
          </div>

          <div class="bench-stat-card">
            <span class="bench-stat-val">{{ localizeDigits(benchmarkResult.insertionTimeMs) }} ms</span>
            <span class="bench-stat-lbl">درج دسته‌ای ۵۰٬۸۰۰ رکورد</span>
          </div>

          <div class="bench-stat-card">
            <span class="bench-stat-val">~{{ localizeDigits(benchmarkResult.estimatedMemoryMb) }} MB</span>
            <span class="bench-stat-lbl">ردپای حافظه RAM تخمینی</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.storage-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin: 0;
}

.card-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.persistence-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.badge-persisted {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}

.badge-regular {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}

.feedback-banner {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.storage-metrics-panel {
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.storage-row-info {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.metric-item {
  display: flex;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.metric-label {
  color: var(--color-text-muted);
}

.metric-val {
  color: var(--color-text-primary);
}

.storage-progress-bar-wrap {
  margin: var(--spacing-xxs) 0;
}

.storage-notice {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
}

.persistence-action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

/* پنل سلامت دیتابیس */
.health-report-panel {
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.health-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.health-label {
  color: var(--color-text-muted);
}

.health-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.pill-healthy {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}

.pill-warning {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
}

.repair-action-row {
  display: flex;
  justify-content: flex-end;
}

/* بنچ‌مارک */
.benchmark-suite-panel {
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
  padding-top: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.benchmark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.bench-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.bench-desc {
  font-size: 11px;
  color: var(--color-text-muted);
}

.bench-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.benchmark-progress-box {
  background-color: var(--color-bg-surface-soft);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.progress-stage-text {
  font-size: var(--font-size-xs);
  color: var(--color-accent);
  font-weight: 600;
}

.benchmark-result-card {
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.result-badge-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.badge-pass {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}

.badge-fail {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
}

.result-summary-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.benchmark-grid-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--spacing-xs);
}

.bench-stat-card {
  background-color: var(--color-bg-surface);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.bench-stat-val {
  font-size: var(--font-size-md);
  font-weight: 800;
  color: var(--color-accent);
}

.bench-stat-lbl {
  font-size: 10px;
  color: var(--color-text-muted);
}

.budget-tag {
  font-size: 9px;
  color: var(--color-success);
  margin-top: 2px;
}
</style>
