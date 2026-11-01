import { ref, onMounted, getCurrentInstance } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const isInstallable = ref(false);
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isInstalled = ref(false);

// اتصال مستقیم چرخه حیات Service Worker به وضعیت واکنشی Vue
const { needRefresh, updateServiceWorker, offlineReady } = useRegisterSW({
  immediate: true,
  onNeedRefresh() {
    needRefresh.value = true;
  },
  onRegisteredSW(_swScriptUrl, registration) {
    if (registration) {
      // بررسی دوره‌ای وجود نسخه جدید هر ۶۰ دقیقه
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);

      // بررسی وجود نسخه جدید هنگام بازگشت یا فوکوس کاربر به برنامه
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', () => {
          registration.update().catch(() => {});
        });
      }
    }
  },
  onRegisterError(error) {
    console.error('Service worker registration failed:', error);
  }
});

export function usePwa() {
  const registerPwaEvents = () => {
    // بررسی نصب بودن در حالت standalone
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true;
    }

    // گرفتن رویداد نصب در مرورگرهای کرومیوم / اندروید
    if (typeof window !== 'undefined') {
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
    }
  };

  if (getCurrentInstance()) {
    onMounted(registerPwaEvents);
  } else {
    registerPwaEvents();
  }

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt.value) return false;
    await deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    deferredPrompt.value = null;
    isInstallable.value = false;
    return outcome === 'accepted';
  };

  const isIos = () => {
    return (
      typeof navigator !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream
    );
  };

  const handleUpdate = async () => {
    await updateServiceWorker(true);
  };

  return {
    isInstallable,
    isInstalled,
    needRefresh,
    offlineReady,
    updateServiceWorker: handleUpdate,
    promptInstall,
    isIos
  };
}
