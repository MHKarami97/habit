import { ref, computed } from 'vue';
import { fa } from './locales/fa';
import { en } from './locales/en';
import { useSettingsStore } from '../stores/useSettingsStore';

export type AppLanguage = 'fa' | 'en';

const currentLocale = ref<AppLanguage>('fa');
const isInitialized = ref(false);

const dictionaries = {
  fa,
  en
};

export function useI18n() {
  const settingsStore = useSettingsStore();

  const isRtl = computed(() => currentLocale.value === 'fa');
  const direction = computed(() => (isRtl.value ? 'rtl' : 'ltr'));

  /**
   * ترجمه کلید با دسترسی ساختاریافته (مثلاً 'nav.today' یا 'common.save')
   */
  const t = (keyPath: string, fallback?: string): string => {
    const dict = dictionaries[currentLocale.value] || dictionaries.fa;
    const parts = keyPath.split('.');
    let current: any = dict;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return fallback || keyPath;
      }
    }

    return typeof current === 'string' ? current : fallback || keyPath;
  };

  /**
   * تغییر زبان برنامه و تنظیم خودکار dir و lang بر روی <html>
   */
  const setLocale = async (lang: AppLanguage) => {
    currentLocale.value = lang;

    if (typeof document !== 'undefined') {
      const isPersian = lang === 'fa';
      document.documentElement.setAttribute('dir', isPersian ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', isPersian ? 'fa-IR' : 'en-US');
    }

    try {
      if (settingsStore.settings.language !== lang) {
        await settingsStore.updateSettings({ language: lang });
      }
    } catch {
      // در محیط‌های تست بدون IndexedDB یا قبل از اتصال
    }
  };

  /**
   * راه‌اندازی زبان اولیه بر اساس تنظیمات ذخیره‌شده
   */
  const initI18n = async () => {
    if (isInitialized.value) return;

    if (settingsStore.settings.language) {
      currentLocale.value = settingsStore.settings.language;
    } else {
      currentLocale.value = 'fa';
    }

    if (typeof document !== 'undefined') {
      const isPersian = currentLocale.value === 'fa';
      document.documentElement.setAttribute('dir', isPersian ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', isPersian ? 'fa-IR' : 'en-US');
    }

    isInitialized.value = true;
  };

  return {
    t,
    currentLocale,
    direction,
    isRtl,
    setLocale,
    initI18n
  };
}
