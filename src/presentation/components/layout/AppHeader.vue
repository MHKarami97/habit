<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

const route = useRoute();
const { formatDate, effectiveTodayIso } = usePersianCalendar();

const formattedToday = computed(() => {
  return formatDate(effectiveTodayIso.value, { includeWeekday: true, fullMonthName: true });
});

const pageTitle = computed(() => {
  switch (route.name) {
    case 'today':
      return 'امروز';
    case 'goals':
      return 'اهداف';
    case 'goal-detail':
      return 'جزئیات هدف';
    case 'habits':
      return 'عادت‌ها';
    case 'analytics':
      return 'آمار و تحلیل';
    case 'settings':
      return 'تنظیمات';
    default:
      return 'کاوش';
  }
});
</script>

<template>
  <header class="app-top-header">
    <div class="header-content">
      <div class="header-titles">
        <h1 class="header-main-title">{{ pageTitle }}</h1>
        <p class="header-date-subtitle">{{ formattedToday }}</p>
      </div>

      <div class="header-actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-top-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: var(--color-bg-app);
  border-bottom: var(--border-width-hairline) solid var(--color-border-subtle);
  padding-top: max(var(--spacing-xs), var(--safe-area-top));
  padding-bottom: var(--spacing-xs);
  backdrop-filter: blur(8px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  max-width: 900px;
  margin: 0 auto;
}

.header-titles {
  display: flex;
  flex-direction: column;
}

.header-main-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.header-date-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
</style>
