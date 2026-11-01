import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSettingsStore } from './useSettingsStore';
import { WebCryptoAdapter } from '@/infrastructure/crypto/WebCryptoAdapter';

export const useAppLockStore = defineStore('appLock', () => {
  const settingsStore = useSettingsStore();

  const isLocked = ref(false);
  const isInitialized = ref(false);
  const failedAttempts = ref(0);
  const lockoutUntil = ref<number | null>(null);
  const lastActiveTimestamp = ref<number>(Date.now());

  const isPinConfigured = computed(() => {
    return (
      settingsStore.settings.isPinLockEnabled &&
      Boolean(settingsStore.settings.pinHashHex) &&
      Boolean(settingsStore.settings.pinSaltHex)
    );
  });

  const remainingLockoutSeconds = computed(() => {
    if (!lockoutUntil.value) return 0;
    const diff = Math.ceil((lockoutUntil.value - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  const isTemporarilyBlocked = computed(() => {
    return remainingLockoutSeconds.value > 0;
  });

  /**
   * راه‌اندازی اولیه و بررسی قفل در بارگذاری اپلیکیشن
   */
  const init = async () => {
    if (isInitialized.value) return;
    await settingsStore.loadSettings();
    if (isPinConfigured.value) {
      isLocked.value = true;
    }

    // لیسنر تغییر دید صفحه (سوئیچ تب یا خروج از برنامه)
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleWindowFocus);
    }

    isInitialized.value = true;
  };

  const recordActivity = () => {
    lastActiveTimestamp.value = Date.now();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      recordActivity();
    } else if (document.visibilityState === 'visible') {
      evaluateTimeout();
    }
  };

  const handleWindowFocus = () => {
    evaluateTimeout();
  };

  /**
   * بررسی انقضای زمان عدم فعالیت و اعمال قفل در صورت لزوم
   */
  const evaluateTimeout = () => {
    if (!isPinConfigured.value || isLocked.value) return;

    const timeoutMinutes = settingsStore.settings.lockTimeoutMinutes;
    if (timeoutMinutes === 0) {
      // قفل بلافاصله پس از رفتن به پس‌زمینه
      isLocked.value = true;
      return;
    }

    const elapsedMs = Date.now() - lastActiveTimestamp.value;
    const maxInactiveMs = timeoutMinutes * 60 * 1000;
    if (elapsedMs >= maxInactiveMs) {
      isLocked.value = true;
    }
  };

  /**
   * تنظیم یا بازنشانی پین جدید
   */
  const setPin = async (newPin: string): Promise<void> => {
    if (!newPin || newPin.trim().length < 4) {
      throw new Error('پین باید حداقل ۴ رقم باشد');
    }

    const saltHex = WebCryptoAdapter.generateRandomHex(16);
    const hashHex = await WebCryptoAdapter.hashPin(newPin.trim(), saltHex);

    await settingsStore.updateSettings({
      isPinLockEnabled: true,
      pinHashHex: hashHex,
      pinSaltHex: saltHex
    });

    isLocked.value = false;
    failedAttempts.value = 0;
    recordActivity();
  };

  /**
   * تغییر پین با راستی‌آزمایی پین فعلی
   */
  const changePin = async (currentPin: string, newPin: string): Promise<boolean> => {
    const verified = await verifyCurrentPin(currentPin);
    if (!verified) return false;

    await setPin(newPin);
    return true;
  };

  /**
   * غیرفعال‌سازی قفل پین با راستی‌آزمایی پین فعلی
   */
  const removePin = async (currentPin: string): Promise<boolean> => {
    const verified = await verifyCurrentPin(currentPin);
    if (!verified) return false;

    await settingsStore.updateSettings({
      isPinLockEnabled: false,
      pinHashHex: undefined,
      pinSaltHex: undefined
    });

    isLocked.value = false;
    failedAttempts.value = 0;
    return true;
  };

  /**
   * راستی‌آزمایی پین بدون تغییر وضعیت قفل
   */
  const verifyCurrentPin = async (pin: string): Promise<boolean> => {
    const storedHash = settingsStore.settings.pinHashHex;
    const storedSalt = settingsStore.settings.pinSaltHex;
    if (!storedHash || !storedSalt) return false;

    return await WebCryptoAdapter.verifyPin(pin, storedHash, storedSalt);
  };

  /**
   * بازگشایی قفل با پین واردشده
   */
  const unlock = async (enteredPin: string): Promise<{ success: boolean; message?: string }> => {
    if (isTemporarilyBlocked.value) {
      return {
        success: false,
        message: `تلاش بیش از حد مجاز. لطفاً ${remainingLockoutSeconds.value} ثانیه صبر کنید.`
      };
    }

    const isValid = await verifyCurrentPin(enteredPin);
    if (isValid) {
      isLocked.value = false;
      failedAttempts.value = 0;
      lockoutUntil.value = null;
      recordActivity();
      return { success: true };
    }

    failedAttempts.value += 1;
    if (failedAttempts.value >= 5) {
      lockoutUntil.value = Date.now() + 30 * 1000; // مسدودسازی ۳۰ ثانیه‌ای
      return {
        success: false,
        message: '۵ بار تلاش ناموفق. دسترسی به مدت ۳۰ ثانیه معلق شد.'
      };
    }

    const remainingTries = 5 - failedAttempts.value;
    return {
      success: false,
      message: `پین نادرست است. (${remainingTries} تلاش باقی‌مانده)`
    };
  };

  /**
   * قفل کردن دستی برنامه
   */
  const lock = () => {
    if (isPinConfigured.value) {
      isLocked.value = true;
    }
  };

  return {
    isLocked,
    isPinConfigured,
    failedAttempts,
    isTemporarilyBlocked,
    remainingLockoutSeconds,
    init,
    setPin,
    changePin,
    removePin,
    verifyCurrentPin,
    unlock,
    lock,
    recordActivity
  };
});
