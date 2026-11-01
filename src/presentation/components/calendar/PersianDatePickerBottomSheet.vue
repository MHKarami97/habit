<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppBottomSheet from '../common/AppBottomSheet.vue';
import AppButton from '../common/AppButton.vue';
import AppIcon from '../common/AppIcon.vue';
import { SolarDateMath, SOLAR_MONTH_NAMES } from '@/infrastructure/calendar/SolarDateMath';
import { useSettingsStore } from '../../stores/useSettingsStore';

const props = defineProps<{
  isOpen: boolean;
  modelValue?: string; // ISO date YYYY-MM-DD
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'close'): void;
}>();

const settingsStore = useSettingsStore();

// سال و ماه جاری در تقویم انتخاب‌گر
const viewSolarYear = ref(1405);
const viewSolarMonth = ref(8); // ۱ تا ۱۲
const selectedDateIso = ref(props.modelValue || '');

const weekDayHeaders = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const initFromModelValue = () => {
  const baseIso = props.modelValue || new Date().toISOString().slice(0, 10);
  selectedDateIso.value = baseIso;
  const parts = baseIso.split('-').map(Number);
  const s = SolarDateMath.gregorianToSolar(parts[0] ?? 2026, parts[1] ?? 11, parts[2] ?? 1);
  viewSolarYear.value = s.year;
  viewSolarMonth.value = s.month;
};

watch(() => props.isOpen, (open) => {
  if (open) initFromModelValue();
});

const currentMonthName = computed(() => SOLAR_MONTH_NAMES[viewSolarMonth.value - 1] ?? '');

const daysInCurrentMonth = computed(() => {
  return SolarDateMath.getDaysInSolarMonth(viewSolarYear.value, viewSolarMonth.value);
});

// محاسبه فاصله تا شنبه برای روز اول ماه شمسی
const firstDayWeekdayOffset = computed(() => {
  const gFirst = SolarDateMath.solarToDate(viewSolarYear.value, viewSolarMonth.value, 1);
  // تبدیل روز میلادی به شنبه=۰
  return (gFirst.getDay() + 1) % 7;
});

const monthDaysList = computed(() => {
  const days: { dayNumber: number; isoDate: string; isSelected: boolean; isToday: boolean }[] = [];
  const todayIso = new Date().toISOString().slice(0, 10);

  for (let d = 1; d <= daysInCurrentMonth.value; d++) {
    const g = SolarDateMath.solarToGregorian(viewSolarYear.value, viewSolarMonth.value, d);
    const mStr = String(g.month).padStart(2, '0');
    const dStr = String(g.day).padStart(2, '0');
    const isoDate = `${g.year}-${mStr}-${dStr}`;

    days.push({
      dayNumber: d,
      isoDate,
      isSelected: isoDate === selectedDateIso.value,
      isToday: isoDate === todayIso
    });
  }

  return days;
});

const prevMonth = () => {
  if (viewSolarMonth.value === 1) {
    viewSolarMonth.value = 12;
    viewSolarYear.value--;
  } else {
    viewSolarMonth.value--;
  }
};

const nextMonth = () => {
  if (viewSolarMonth.value === 12) {
    viewSolarMonth.value = 1;
    viewSolarYear.value++;
  } else {
    viewSolarMonth.value++;
  }
};

const selectDay = (isoDate: string) => {
  selectedDateIso.value = isoDate;
};

const confirmSelection = () => {
  emit('update:modelValue', selectedDateIso.value);
  emit('close');
};

const formatDigit = (num: number) => {
  if (settingsStore.settings.numberFormat === 'latin') return String(num);
  return SolarDateMath.toPersianDigits(num);
};
</script>

<template>
  <AppBottomSheet :is-open="isOpen" :title="title || 'انتخاب تاریخ شمسی'" @close="$emit('close')">
    <div class="datepicker-body">
      <!-- نوار ناوبری ماه و سال -->
      <div class="month-navigator">
        <button type="button" class="nav-btn touch-target" aria-label="ماه بعد" @click="nextMonth">
          <AppIcon name="chevron-right" size="18" />
        </button>

        <div class="month-year-label">
          <span class="month-name">{{ currentMonthName }}</span>
          <span class="year-num">{{ formatDigit(viewSolarYear) }}</span>
        </div>

        <button type="button" class="nav-btn touch-target" aria-label="ماه قبل" @click="prevMonth">
          <AppIcon name="chevron-left" size="18" />
        </button>
      </div>

      <!-- هدر روزهای هفته -->
      <div class="weekdays-grid">
        <div v-for="w in weekDayHeaders" :key="w" class="weekday-header-cell">
          {{ w }}
        </div>
      </div>

      <!-- شبکه روزهای ماه -->
      <div class="days-grid">
        <!-- سلول‌های خالی قبل از روز اول ماه -->
        <div
          v-for="blank in firstDayWeekdayOffset"
          :key="`blank-${blank}`"
          class="day-cell-empty"
        />

        <!-- روزهای ماه -->
        <button
          v-for="day in monthDaysList"
          :key="day.isoDate"
          type="button"
          :class="[
            'day-cell-btn',
            {
              'is-selected': day.isSelected,
              'is-today': day.isToday
            }
          ]"
          @click="selectDay(day.isoDate)"
        >
          {{ formatDigit(day.dayNumber) }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="datepicker-footer">
        <AppButton variant="ghost" size="md" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" @click="confirmSelection">
          تأیید تاریخ
        </AppButton>
      </div>
    </template>
  </AppBottomSheet>
</template>

<style scoped>
.datepicker-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.month-navigator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xs);
}

.month-year-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}
.nav-btn:hover {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-primary);
}

.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding-bottom: var(--spacing-xxs);
  border-bottom: var(--border-width-hairline) solid var(--color-border-subtle);
}

.weekday-header-cell {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  padding: var(--spacing-xxs) 0;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding-top: var(--spacing-xs);
}

.day-cell-empty {
  height: 40px;
}

.day-cell-btn {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  background: transparent;
  transition: all var(--transition-fast);
}

.day-cell-btn:hover {
  background-color: var(--color-bg-surface-elevated);
}

.day-cell-btn.is-today {
  border: var(--border-width-regular) solid var(--color-accent);
}

.day-cell-btn.is-selected {
  background-color: var(--color-accent);
  color: #ffffff;
  font-weight: 700;
}

.datepicker-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  width: 100%;
}
</style>
