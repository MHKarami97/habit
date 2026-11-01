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

const settingsStore = useSettingsStore();
const { applyTheme } = useTheme();
const { isInstalled, needRefresh, promptInstall, isIos } = usePwa();

const isIosModalOpen = ref(false);
const isOnboardingOpen = computed(() => {
  return !settingsStore.isLoading && !settingsStore.settings.hasCompletedOnboarding;
});

onMounted(async () => {
  await settingsStore.loadSettings();
  applyTheme(settingsStore.settings.theme);
});

const handleInstallClick = async () => {
  if (isIos()) {
    isIosModalOpen.value = true;
  } else {
    await promptInstall();
  }
};

const reloadApp = () => {
  window.location.reload();
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

      <main class="app-main-viewport">
        <RouterView />
      </main>
    </div>

    <!-- ناوبری پایین صفحه موبایل -->
    <BottomNavigation />

    <!-- نوتیفیکیشن به‌روزرسانی نسخه جدید PWA -->
    <PwaUpdateToast
      :need-refresh="needRefresh"
      @update="reloadApp"
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
</style>
