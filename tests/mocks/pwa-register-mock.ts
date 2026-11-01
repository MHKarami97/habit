import { ref } from 'vue';

export interface RegisterSWOptions {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (error: unknown) => void;
}

export function useRegisterSW(_options: RegisterSWOptions = {}) {
  const needRefresh = ref(false);
  const offlineReady = ref(false);
  const updateServiceWorker = async (_reloadPage: boolean = true) => {};
  return {
    needRefresh,
    offlineReady,
    updateServiceWorker
  };
}
