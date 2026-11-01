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
    return IntlPersianCalendarAdapter.formatShort(
      dateOrIso,
      settingsStore.settings.numberFormat
    );
  };

  const localizeDigits = (val: string | number) => {
    if (settingsStore.settings.numberFormat === 'latin') {
      return String(val);
    }
    return SolarDateMath.toPersianDigits(val);
  };

  return {
    effectiveTodayIso,
    formatDate,
    formatShortDate,
    localizeDigits
  };
}
