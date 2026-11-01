import { computed } from 'vue';
import { IntlPersianCalendarAdapter, PersianCalendarFormatOptions } from '@/infrastructure/calendar/IntlPersianCalendarAdapter';
import { SolarDateMath } from '@/infrastructure/calendar/SolarDateMath';
import { useSettingsStore } from '../stores/useSettingsStore';

export function usePersianCalendar() {
  const settingsStore = useSettingsStore();

  const effectiveTodayIso = computed(() => {
    return IntlPersianCalendarAdapter.getEffectiveTodayIso(settingsStore.settings.endOfDayHour);
  });

  const formatDate = (dateOrIso: string | Date, options: PersianCalendarFormatOptions = {}) => {
    if (settingsStore.settings.language === 'en') {
      const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: options.fullMonthName ? 'long' : 'short',
        day: 'numeric',
        weekday: options.includeWeekday ? 'short' : undefined
      });
    }
    return IntlPersianCalendarAdapter.formatPersian(
      dateOrIso,
      {
        numberFormat: settingsStore.settings.numberFormat,
        ...options
      },
      settingsStore.settings.endOfDayHour
    );
  };

  const formatShortDate = (dateOrIso: string | Date) => {
    if (settingsStore.settings.language === 'en') {
      const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
      return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    }
    return IntlPersianCalendarAdapter.formatShort(
      dateOrIso,
      settingsStore.settings.numberFormat
    );
  };

  const formatLongDate = (dateOrIso: string | Date) => {
    return formatDate(dateOrIso, { includeWeekday: true, fullMonthName: true });
  };

  const localizeDigits = (val: string | number) => {
    if (settingsStore.settings.language === 'en' || settingsStore.settings.numberFormat === 'latin') {
      return String(val);
    }
    return SolarDateMath.toPersianDigits(val);
  };

  return {
    effectiveTodayIso,
    formatDate,
    formatShortDate,
    formatLongDate,
    localizeDigits
  };
}
