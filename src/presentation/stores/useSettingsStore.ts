import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UserSettings, UserSettingsProps } from '@/domain/entities/UserSettings';
import { container } from '@/infrastructure/di/container';
import { PersistenceManager, StorageQuotaEstimate } from '@/infrastructure/storage/PersistenceManager';

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>(UserSettings.createDefault());
  const isLoading = ref(true);
  const storageEstimate = ref<StorageQuotaEstimate | null>(null);

  const loadSettings = async () => {
    isLoading.value = true;
    try {
      const stored = await container.settingsRepo.getSettings();
      settings.value = stored;
      await refreshStorageStatus();
    } finally {
      isLoading.value = false;
    }
  };

  const updateSettings = async (updates: Partial<UserSettingsProps>) => {
    const updated = settings.value.withUpdates(updates);
    settings.value = updated;
    await container.settingsRepo.saveSettings(updated);
  };

  const refreshStorageStatus = async () => {
    const isPersisted = await PersistenceManager.isPersisted();
    const estimate = await PersistenceManager.getEstimate();
    storageEstimate.value = estimate;
    if (settings.value.isStoragePersisted !== isPersisted) {
      await updateSettings({ isStoragePersisted: isPersisted });
    }
  };

  const requestPersistentStorage = async (): Promise<boolean> => {
    const granted = await PersistenceManager.requestPersistence();
    await refreshStorageStatus();
    return granted;
  };

  const wipeAllData = async () => {
    await container.settingsRepo.wipeAllData();
    settings.value = UserSettings.createDefault();
    await refreshStorageStatus();
  };

  const completeOnboarding = async () => {
    await updateSettings({ hasCompletedOnboarding: true });
  };

  return {
    settings,
    isLoading,
    storageEstimate,
    loadSettings,
    updateSettings,
    refreshStorageStatus,
    requestPersistentStorage,
    wipeAllData,
    completeOnboarding
  };
});
