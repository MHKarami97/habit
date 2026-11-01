import { ref, onMounted } from 'vue';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const isInstallable = ref(false);
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isInstalled = ref(false);
const needRefresh = ref(false);

export function usePwa() {
  onMounted(() => {
    // بررسی نصب بودن در حالت standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true;
    }

    // گرفتن رویداد نصب در مرورگرهای کرومیوم / اندروید
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt.value = e as BeforeInstallPromptEvent;
      isInstallable.value = true;
    });

    window.addEventListener('appinstalled', () => {
      isInstalled.value = true;
      isInstallable.value = false;
      deferredPrompt.value = null;
    });
  });

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt.value) return false;
    await deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    deferredPrompt.value = null;
    isInstallable.value = false;
    return outcome === 'accepted';
  };

  const isIos = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };

  return {
    isInstallable,
    isInstalled,
    needRefresh,
    promptInstall,
    isIos
  };
}
