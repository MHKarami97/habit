import { describe, it, expect, beforeEach } from 'vitest';
import { useI18n } from '../../src/presentation/i18n/useI18n';
import { usePersianCalendar } from '../../src/presentation/composables/usePersianCalendar';
import { useSettingsStore } from '../../src/presentation/stores/useSettingsStore';
import { setActivePinia, createPinia } from 'pinia';

describe('Phase 3 Package 4: Lightweight i18n Localization & Calendar Adaptation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Translation Key Traversal & Fallback', () => {
    it('translates navigation and common keys in Persian (default)', () => {
      const { t, setLocale } = useI18n();
      setLocale('fa');

      expect(t('nav.today')).toBe('امروز');
      expect(t('nav.goals')).toBe('اهداف');
      expect(t('common.save')).toBe('ذخیره');
      expect(t('common.cancel')).toBe('انصراف');
      expect(t('goals.status.active')).toBe('در حال پیشرفت');
    });

    it('translates keys accurately in English mode', async () => {
      const { t, setLocale } = useI18n();
      await setLocale('en');

      expect(t('nav.today')).toBe('Today');
      expect(t('nav.goals')).toBe('Goals');
      expect(t('common.save')).toBe('Save');
      expect(t('common.cancel')).toBe('Cancel');
      expect(t('goals.status.active')).toBe('In Progress');
    });

    it('returns custom fallback or key path if a key does not exist', () => {
      const { t } = useI18n();
      expect(t('nonexistent.path.key', 'مقدار پیش‌فرض')).toBe('مقدار پیش‌فرض');
      expect(t('nonexistent.path.key')).toBe('nonexistent.path.key');
    });
  });

  describe('Directionality & Locale State', () => {
    it('sets RTL direction for Persian locale', async () => {
      const { setLocale, direction, isRtl } = useI18n();
      await setLocale('fa');

      expect(isRtl.value).toBe(true);
      expect(direction.value).toBe('rtl');
    });

    it('sets LTR direction for English locale', async () => {
      const { setLocale, direction, isRtl } = useI18n();
      await setLocale('en');

      expect(isRtl.value).toBe(false);
      expect(direction.value).toBe('ltr');
    });
  });

  describe('Calendar Formatting under English vs Persian Locales', () => {
    it('formats dates in Gregorian format when in English mode and Solar in Persian mode', async () => {
      const { setLocale } = useI18n();
      const settingsStore = useSettingsStore();
      const { formatDate, localizeDigits } = usePersianCalendar();

      // ۱. حالت انگلیسی
      await setLocale('en');
      settingsStore.settings = settingsStore.settings.withUpdates({ language: 'en' });
      const testIso = '2026-11-01';
      const formattedEn = formatDate(testIso);
      expect(formattedEn).toContain('2026');
      expect(localizeDigits(1234)).toBe('1234'); // ارقام لاتین

      // ۲. حالت فارسی
      await setLocale('fa');
      settingsStore.settings = settingsStore.settings.withUpdates({ language: 'fa', numberFormat: 'persian' });
      const formattedFa = formatDate(testIso);
      expect(formattedFa).toContain('۱۴۰۵'); // سال ۱۴۰۵ خورشیدی
      expect(localizeDigits(1234)).toBe('۱۲۳۴'); // ارقام فارسی
    });
  });
});
