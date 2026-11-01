<script setup lang="ts">
import { ref, computed } from 'vue';
import { SolarDateMath, SOLAR_MONTH_NAMES } from '@/infrastructure/calendar/SolarDateMath';
import { useHabitStore } from '../../stores/useHabitStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppIcon from '../common/AppIcon.vue';

const props = withDefaults(
  defineProps<{
    initialYear?: number;
  }>(),
  {}
);

const habitStore = useHabitStore();
const { effectiveTodayIso, localizeDigits } = usePersianCalendar();

// استخراج سال شمسی امروز
const currentSolar = computed(() => {
  const d = new Date(effectiveTodayIso.value);
  return SolarDateMath.gregorianToSolar(d.getFullYear(), d.getMonth() + 1, d.getDate());
});

const selectedYear = ref<number>(props.initialYear || currentSolar.value.year);

const isLeapYear = computed(() => {
  return SolarDateMath.isSolarLeap(selectedYear.value);
});

// داده‌های لاگ روزانه به صورت مپ سریع برای جست‌وجوی O(1)
const dailyCompletionCountMap = computed(() => {
  const map = new Map<string, number>();
  habitStore.habitLogsMap.forEach(logs => {
    for (const log of logs) {
      if (log.isCompleted || log.isFrozen) {
        map.set(log.date, (map.get(log.date) || 0) + 1);
      }
    }
  });
  return map;
});

// ساختار ۱۲ ماه شمسی با اطلاعات تمام ۳۶۵ یا ۳۶۶ روز
const monthsData = computed(() => {
  const year = selectedYear.value;
  const pad = (n: number) => String(n).padStart(2, '0');

  return SOLAR_MONTH_NAMES.map((monthName, mIdx) => {
    const monthNum = mIdx + 1;
    const daysInMonth = SolarDateMath.getDaysInSolarMonth(year, monthNum);

    // محاسبه روز هفته روز اول ماه (شنبه=۰، جمعه=۶)
    const firstDayG = SolarDateMath.solarToGregorian(year, monthNum, 1);
    const firstDayDate = new Date(firstDayG.year, firstDayG.month - 1, firstDayG.day);
    const firstDayOfWeek = (firstDayDate.getDay() + 1) % 7;

    const days = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const g = SolarDateMath.solarToGregorian(year, monthNum, dayNum);
      const dateIso = `${g.year}-${pad(g.month)}-${pad(g.day)}`;
      const completedCount = dailyCompletionCountMap.value.get(dateIso) || 0;

      // محاسبه مختصات در تقویم کوچک ماه (۷ ستون x تا ۶ سطر)
      const cellIndex = firstDayOfWeek + dayNum - 1;
      const col = cellIndex % 7;
      const row = Math.floor(cellIndex / 7);

      // محاسبه سطح رنگی پیوسته (۰ تا ۴)
      let level = 0;
      if (completedCount === 1) level = 1;
      else if (completedCount === 2) level = 2;
      else if (completedCount === 3) level = 3;
      else if (completedCount >= 4) level = 4;

      days.push({
        dayNum,
        dateIso,
        solarFormatted: `${dayNum} ${monthName} ${year}`,
        completedCount,
        level,
        col,
        row
      });
    }

    return {
      monthNum,
      monthName,
      daysInMonth,
      firstDayOfWeek,
      days
    };
  });
});

// آمار کل سال
const yearStats = computed(() => {
  let totalActiveDays = 0;
  let totalCompletions = 0;
  let totalDaysInYear = 0;

  for (const m of monthsData.value) {
    totalDaysInYear += m.daysInMonth;
    for (const d of m.days) {
      if (d.completedCount > 0) {
        totalActiveDays++;
        totalCompletions += d.completedCount;
      }
    }
  }

  const yearlyConsistencyRate = Math.round((totalActiveDays / totalDaysInYear) * 100);

  return {
    totalDaysInYear,
    totalActiveDays,
    totalCompletions,
    yearlyConsistencyRate
  };
});

// وضعیت تول‌تیپ تعاملی
const tooltip = ref<{
  visible: boolean;
  x: number;
  y: number;
  title: string;
  count: number;
} | null>(null);

const handleCellHover = (
  event: MouseEvent | TouchEvent,
  day: { solarFormatted: string; completedCount: number }
) => {
  let clientX = 0;
  let clientY = 0;

  if ('touches' in event && event.touches[0]) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if ('clientX' in event) {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  tooltip.value = {
    visible: true,
    x: clientX,
    y: clientY - 45,
    title: day.solarFormatted,
    count: day.completedCount
  };
};

const handleCellLeave = () => {
  tooltip.value = null;
};
</script>

<template>
  <div class="solar-heatmap-container">
    <header class="heatmap-header">
      <div class="header-titles">
        <h3 class="heatmap-title">نقشه گرمایی سالانه شمسی</h3>
        <span class="heatmap-subtitle">
          توزیع ۳۶۵/۳۶۶ روز سال در ۱۲ ماه هجری شمسی (فروردین تا اسفند)
        </span>
      </div>

      <!-- انتخاب سال شمسی -->
      <div class="year-selector">
        <button
          type="button"
          class="year-nav-btn touch-target"
          title="سال قبل"
          @click="selectedYear--"
        >
          <AppIcon name="chevron-right" size="16" />
        </button>
        <span class="current-year-badge">
          سال {{ localizeDigits(selectedYear) }}
          <span v-if="isLeapYear" class="leap-tag">(کبیسه)</span>
        </span>
        <button
          type="button"
          class="year-nav-btn touch-target"
          title="سال بعد"
          :disabled="selectedYear >= currentSolar.year"
          @click="selectedYear++"
        >
          <AppIcon name="chevron-left" size="16" />
        </button>
      </div>
    </header>

    <!-- شاخص‌های کلیدی سالانه -->
    <div class="year-summary-strip">
      <div class="summary-metric">
        <span class="metric-val">{{ localizeDigits(yearStats.totalCompletions) }}</span>
        <span class="metric-lbl">کل عادات ثبت‌شده سال</span>
      </div>
      <div class="summary-metric">
        <span class="metric-val">{{ localizeDigits(yearStats.totalActiveDays) }}</span>
        <span class="metric-lbl">روزهای فعال از {{ localizeDigits(yearStats.totalDaysInYear) }} روز</span>
      </div>
      <div class="summary-metric">
        <span class="metric-val">{{ localizeDigits(yearStats.yearlyConsistencyRate) }}٪</span>
        <span class="metric-lbl">نرخ پیوستگی سالانه</span>
      </div>
    </div>

    <!-- گرید ماه‌های ۱۲گانه شمسی در قالب SVG سبک و رسپانسیو -->
    <div class="heatmap-svg-wrapper">
      <div class="months-cards-grid">
        <div
          v-for="month in monthsData"
          :key="month.monthNum"
          class="month-card"
        >
          <div class="month-card-header">
            <span class="month-name">{{ month.monthName }}</span>
            <span class="month-days-count">{{ localizeDigits(month.daysInMonth) }} روز</span>
          </div>

          <!-- مینی تقویم SVG برای این ماه -->
          <svg
            class="month-svg"
            viewBox="0 0 119 110"
            role="img"
            :aria-label="`نقشه فعالیت ماه ${month.monthName}`"
          >
            <!-- ردیف عنوان روزهای هفته: شنبه تا جمعه -->
            <g class="weekday-labels" font-size="7" fill="var(--color-text-muted)" text-anchor="middle">
              <text x="8" y="9">ش</text>
              <text x="25" y="9">ی</text>
              <text x="42" y="9">د</text>
              <text x="59" y="9">س</text>
              <text x="76" y="9">چ</text>
              <text x="93" y="9">پ</text>
              <text x="110" y="9">ج</text>
            </g>

            <!-- سلول‌های روزهای ماه -->
            <g class="days-cells" transform="translate(1, 14)">
              <rect
                v-for="d in month.days"
                :key="d.dayNum"
                :x="d.col * 17"
                :y="d.row * 15"
                width="14"
                height="12"
                rx="2.5"
                :class="['day-rect', `level-${d.level}`]"
                @mouseenter="handleCellHover($event, d)"
                @mouseleave="handleCellLeave"
                @touchstart.passive="handleCellHover($event, d)"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>

    <!-- راهنمای مقیاس رنگی پیوسته -->
    <footer class="heatmap-footer">
      <div class="heatmap-legend">
        <span class="legend-lbl">کمتر</span>
        <span class="legend-cell level-0" title="صفر فعالیت" />
        <span class="legend-cell level-1" title="۱ عادت" />
        <span class="legend-cell level-2" title="۲ عادت" />
        <span class="legend-cell level-3" title="۳ عادت" />
        <span class="legend-cell level-4" title="۴+ عادت" />
        <span class="legend-lbl">بیشتر</span>
      </div>
      <span class="legend-help-hint">
        برای مشاهده جزئیات هر روز، روی خانه تقویم اشاره کنید.
      </span>
    </footer>

    <!-- تول‌تیپ شناور -->
    <div
      v-if="tooltip && tooltip.visible"
      class="heatmap-floating-tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <div class="tooltip-title">{{ tooltip.title }}</div>
      <div class="tooltip-body">
        {{ localizeDigits(tooltip.count) }} عادت تکمیل‌شده
      </div>
    </div>
  </div>
</template>

<style scoped>
.solar-heatmap-container {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  position: relative;
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.heatmap-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.heatmap-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.year-selector {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-full);
  padding: 3px 6px;
  gap: 4px;
}

.year-nav-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.year-nav-btn:hover:not(:disabled) {
  background-color: var(--color-bg-surface);
  color: var(--color-accent);
}

.year-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.current-year-badge {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
  padding: 0 4px;
}

.leap-tag {
  font-size: 10px;
  color: var(--color-accent);
  font-weight: 600;
}

.year-summary-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

@media (max-width: 480px) {
  .year-summary-strip {
    grid-template-columns: 1fr;
  }
}

.summary-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-val {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-accent);
}

.metric-lbl {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.heatmap-svg-wrapper {
  overflow-x: auto;
  padding-bottom: var(--spacing-xs);
}

.months-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

@media (max-width: 900px) {
  .months-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .months-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 380px) {
  .months-cards-grid {
    grid-template-columns: 1fr;
  }
}

.month-card {
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.month-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
}

.month-name {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
}

.month-days-count {
  font-size: 10px;
  color: var(--color-text-muted);
}

.month-svg {
  width: 100%;
  height: auto;
  display: block;
}

.day-rect {
  stroke: var(--color-border-subtle);
  stroke-width: 0.5px;
  cursor: pointer;
  transition: transform var(--transition-fast), filter var(--transition-fast);
}

.day-rect:hover {
  transform: scale(1.15);
  transform-origin: center;
  stroke: var(--color-text-primary);
  stroke-width: 1px;
}

/* مقیاس رنگی پیوسته فعالیت */
.level-0 {
  fill: var(--color-bg-surface);
}

.level-1 {
  fill: #86efac; /* سبز روشن */
}

.level-2 {
  fill: #4ade80;
}

.level-3 {
  fill: #22c55e;
}

.level-4 {
  fill: #15803d; /* سبز تیره عمیق */
}

.heatmap-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-xs);
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
}

.legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  display: inline-block;
}

.legend-help-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* تول‌تیپ شناور */
.heatmap-floating-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background-color: var(--color-text-primary);
  color: var(--color-bg-surface);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: var(--shadow-md);
  white-space: nowrap;
}

.tooltip-title {
  font-weight: 700;
  margin-bottom: 2px;
}

.tooltip-body {
  font-size: 10px;
  opacity: 0.9;
}
</style>
