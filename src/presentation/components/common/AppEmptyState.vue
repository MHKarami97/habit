<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
  }>(),
  {}
);
</script>

<template>
  <div class="empty-state-wrapper">
    <!-- الگوی گرافیکی اختصاصی SVG با فرم‌های گرم و هندسی -->
    <svg class="empty-state-illustration" viewBox="0 0 160 120" fill="none" aria-hidden="true">
      <!-- افق خط‌چین ملایم -->
      <line x1="20" y1="95" x2="140" y2="95" stroke="var(--color-border-strong)" stroke-width="1.5" stroke-dasharray="4 4" />
      <!-- خورشید / دایره گرم هندسی در پس‌زمینه -->
      <circle cx="80" cy="55" r="32" fill="var(--color-accent-subtle)" />
      <!-- حلقه سنجه / هدف با خطوط دقیق -->
      <circle cx="80" cy="55" r="22" stroke="var(--color-accent)" stroke-width="1.5" stroke-dasharray="3 3" />
      <circle cx="80" cy="55" r="10" stroke="var(--color-accent)" stroke-width="2" />
      <!-- نقطه تمرکز مرکزی -->
      <circle cx="80" cy="55" r="3" fill="var(--color-accent)" />
      <!-- نشانگرهای کوچک تعادل هندسی -->
      <rect x="36" y="80" width="8" height="15" rx="3" fill="var(--color-border-strong)" opacity="0.6" />
      <rect x="116" y="74" width="8" height="21" rx="3" fill="var(--color-accent)" opacity="0.4" />
      <circle cx="40" cy="40" r="2" fill="var(--color-warning)" />
      <circle cx="120" cy="35" r="2.5" fill="var(--color-success)" />
    </svg>

    <h4 class="empty-state-title">{{ title }}</h4>
    <p v-if="description" class="empty-state-desc">{{ description }}</p>

    <div v-if="$slots.action" class="empty-state-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--color-text-secondary);
}

.empty-state-illustration {
  width: 140px;
  height: 105px;
  margin-bottom: var(--spacing-md);
}

.empty-state-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xxs);
}

.empty-state-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 340px;
  line-height: 1.5;
  margin-bottom: var(--spacing-md);
}

.empty-state-action {
  margin-top: var(--spacing-xs);
}
</style>
