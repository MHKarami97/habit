import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CloudRestoreMode, CloudSyncSnapshot } from '@/domain/entities/CloudSync';
import { cloudSyncService } from '@/infrastructure/cloud';
import { useSettingsStore } from './useSettingsStore';
import { useHabitStore } from './useHabitStore';
import { useGoalStore } from './useGoalStore';
import { usePeriodicReviewStore } from './usePeriodicReviewStore';
import { formatDateTimeFa } from '@/infrastructure/cloud/cloudFormat';

export const useCloudSyncStore = defineStore('cloudSync', () => {
  const settingsStore = useSettingsStore();
  const habitStore = useHabitStore();
  const goalStore = useGoalStore();
  const periodicReviewStore = usePeriodicReviewStore();

  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline.value = true;
    });
    window.addEventListener('offline', () => {
      isOnline.value = false;
    });
  }

  const snapshot = ref<CloudSyncSnapshot>(cloudSyncService.getSnapshot());
  cloudSyncService.subscribe(next => {
    snapshot.value = next;
  });

  cloudSyncService.setDataRestoredHandler(async () => {
    await settingsStore.loadSettings();
    await habitStore.loadHabits();
    await goalStore.loadGoals();
    await periodicReviewStore.loadReviews();
  });

  const isConnected = computed(() => snapshot.value.connected);
  const isBusy = computed(() => snapshot.value.status === 'syncing');
  const lastSuccessText = computed(() => formatDateTimeFa(snapshot.value.lastSuccessAt));

  const statusText = computed(() => {
    switch (snapshot.value.status) {
      case 'disconnected':
        return 'متصل نیست';
      case 'syncing':
        return 'در حال همگام‌سازی...';
      case 'needs-reconnect':
        return 'اتصال به Google نیاز به تأیید دوباره دارد';
      case 'error':
        return snapshot.value.lastError || 'همگام‌سازی ناموفق بود';
      case 'decision-pending':
        return 'نسخه‌ی ابری منتظر تصمیم شماست';
      case 'success':
        return 'همگام و به‌روز است';
      default:
        return snapshot.value.lastSuccessAt
          ? 'همگام و به‌روز است'
          : 'متصل است؛ هنوز پشتیبانی گرفته نشده';
    }
  });

  // Failures are only surfaced while online: offline is a normal state for this app.
  const showFailureBar = computed(() => {
    const status = snapshot.value.status;
    return (
      snapshot.value.connected &&
      snapshot.value.notifyFailures &&
      (status === 'error' || status === 'needs-reconnect') &&
      isOnline.value
    );
  });

  const failureBarMessage = computed(() =>
    snapshot.value.status === 'needs-reconnect'
      ? 'دیتا همگام‌سازی نشد؛ اتصال به Google Drive نیاز به تأیید دوباره دارد.'
      : `دیتا همگام‌سازی نشد. ${snapshot.value.lastError || ''}`.trim()
  );

  return {
    snapshot,
    isConnected,
    isBusy,
    isOnline,
    statusText,
    lastSuccessText,
    showFailureBar,
    failureBarMessage,
    start: () => cloudSyncService.start(),
    preload: () => cloudSyncService.preload(),
    connect: () => cloudSyncService.connect(),
    disconnect: (deleteRemote: boolean) => cloudSyncService.disconnect(deleteRemote),
    backupNow: () => cloudSyncService.backupNow('manual'),
    resolveRestore: (mode: CloudRestoreMode, passphrase?: string) =>
      cloudSyncService.resolveRestore(mode, passphrase),
    resolveKeepLocal: () => cloudSyncService.resolveKeepLocal(),
    dismissDecision: () => cloudSyncService.dismissDecision(),
    reopenDecision: () => cloudSyncService.reopenDecision(),
    rollbackLastRestore: () => cloudSyncService.rollbackLastRestore(),
    enableEncryption: (passphrase: string) => cloudSyncService.enableEncryption(passphrase),
    disableEncryption: () => cloudSyncService.disableEncryption(),
    setNotifyFailures: (value: boolean) => cloudSyncService.setNotifyFailures(value)
  };
});
