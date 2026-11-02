<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterView } from 'vue-router';
import { useSettingsStore } from './presentation/stores/useSettingsStore';
import { useTheme } from './presentation/composables/useTheme';
import { usePwa } from './presentation/composables/usePwa';
import AppHeader from './presentation/components/layout/AppHeader.vue';
import BottomNavigation from './presentation/components/layout/BottomNavigation.vue';
import SidebarNavigation from './presentation/components/layout/SidebarNavigation.vue';
import PwaUpdateToast from './presentation/components/common/PwaUpdateToast.vue';
import IosInstallModal from './presentation/components/layout/IosInstallModal.vue';
import OnboardingModal from './presentation/components/onboarding/OnboardingModal.vue';
import AppButton from './presentation/components/common/AppButton.vue';
import AppIcon from './presentation/components/common/AppIcon.vue';

import { IndexedDBHealthService, type DatabaseHealthReport } from './infrastructure/db/IndexedDBHealthService';
import { useAppLockStore } from './presentation/stores/useAppLockStore';
import PinLockOverlay from './presentation/components/security/PinLockOverlay.vue';
import { useI18n } from './presentation/i18n/useI18n';
import SyncFailedBar from './presentation/components/common/SyncFailedBar.vue';
import CloudConflictModal from './presentation/components/cloud/CloudConflictModal.vue';
import AppToast from './presentation/components/common/AppToast.vue';
import { useCloudSyncStore } from './presentation/stores/useCloudSyncStore';

const settingsStore = useSettingsStore();
const appLockStore = useAppLockStore();
const cloudSyncStore = useCloudSyncStore();
const { applyTheme } = useTheme();
const { initI18n } = useI18n();
const { isInstalled, needRefresh, updateServiceWorker, promptInstall, isIos } = usePwa();

const appToastMessage = ref('');
const appToastType = ref<'success' | 'warning' | 'danger' | 'info'>('info');

const handleShowToast = (msg: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
  appToastMessage.value = msg;
  appToastType.value = type;
  setTimeout(() => {
    appToastMessage.value = '';
  }, 4000);
};

const isIosModalOpen = ref(false);
const dbHealthReport = ref<DatabaseHealthReport | null>(null);
const isOnboardingOpen = computed(() => {
  return !settingsStore.isLoading && !settingsStore.settings.hasCompletedOnboarding;
});

onMounted(async () => {
  await settingsStore.loadSettings();
  applyTheme(settingsStore.settings.theme);
  await initI18n();
  await appLockStore.init();

  // بررسی سلامت دیتابیس محلی
  dbHealthReport.value = await IndexedDBHealthService.checkHealth();

  // همگام‌سازی و بررسی نسخه ابری در پس‌زمینه (بدون مسدودسازی رندر اولیه)
  void cloudSyncStore.start();
});

const handleInstallClick = async () => {
  if (isIos()) {
    isIosModalOpen.value = true;
  } else {
    await promptInstall();
  }
};

const handleUpdateApp = async () => {
  try {
    await updateServiceWorker();
  } catch (error) {
    console.error('خطا در اعمال نسخه جدید PWA:', error);
    window.location.reload();
  }
};
</script>

<template>
  <div class="app-shell-layout">
    <!-- سایدبار تبلت و دسکتاپ -->
    <SidebarNavigation />

    <!-- ستون محتوای اصلی -->
    <div class="app-main-column">
      <AppHeader>
        <template #actions>
          <AppButton
            v-if="!isInstalled"
            variant="outline"
            size="sm"
            class="install-app-btn"
            @click="handleInstallClick"
          >
            <AppIcon name="download" size="16" />
            نصب برنامه
          </AppButton>
        </template>
      </AppHeader>

      <!-- بنر هشدار محدودیت یا خطای پایگاه داده مرورگر -->
      <aside
        v-if="dbHealthReport && !dbHealthReport.isHealthy"
        class="db-health-warning-banner animate-slide-up"
        role="alert"
      >
        <AppIcon name="alert" size="18" class="warning-icon" />
        <div class="warning-text">
          <strong>هشدار پایگاه داده: </strong>
          <span>{{ dbHealthReport.statusMessage }}</span>
        </div>
      </aside>

      <main class="app-main-viewport">
        <RouterView />
      </main>
    </div>

    <!-- ناوبری پایین صفحه موبایل -->
    <BottomNavigation />

    <!-- نوتیفیکیشن به‌روزرسانی نسخه جدید PWA -->
    <PwaUpdateToast
      :need-refresh="needRefresh"
      @update="handleUpdateApp"
      @close="needRefresh = false"
    />

    <!-- راهنمای گام‌به‌گام نصب در iOS -->
    <IosInstallModal
      :is-open="isIosModalOpen"
      @close="isIosModalOpen = false"
    />

    <!-- معارفه اولیه کاربر (Onboarding) -->
    <OnboardingModal
      :is-open="isOnboardingOpen"
      @close="settingsStore.completeOnboarding()"
    />

    <!-- لایه قفل ورود (PIN Lock Overlay) -->
    <PinLockOverlay />

    <!-- نوار وضعیت خطای همگام‌سازی ابری و پنجره تصمیم‌گیری تعارض -->
    <SyncFailedBar />
    <CloudConflictModal @toast="handleShowToast" />

    <!-- اعلان پیام‌های سراسری (Toast) -->
    <AppToast
      :show="Boolean(appToastMessage)"
      :type="appToastType"
      :message="appToastMessage"
      @close="appToastMessage = ''"
    />
  </div>
</template>

<style>
/* بارگذاری استایل‌های بنیادین */
@import './presentation/styles/tokens.css';
@import './presentation/styles/base.css';
@import './presentation/styles/typography.css';
@import './presentation/styles/animations.css';
</style>

<style scoped>
.app-shell-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
}

.app-main-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-bottom: calc(56px + var(--safe-area-bottom));
}

@media (min-width: 768px) {
  .app-main-column {
    padding-bottom: var(--spacing-lg);
  }
}

.app-main-viewport {
  flex: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: var(--spacing-md);
}

.install-app-btn {
  font-size: var(--font-size-xs);
}

.db-health-warning-banner {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
  border-bottom: 1px solid var(--color-danger);
  padding: var(--spacing-xs) var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.warning-icon {
  flex-shrink: 0;
}

.warning-text {
  line-height: 1.4;
}
</style>
