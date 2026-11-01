<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean;
    clickable?: boolean;
    color?: string;
  }>(),
  {
    active: false,
    clickable: true
  }
);

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <button
    type="button"
    :class="['app-chip', { 'chip-active': active, 'chip-static': !clickable }]"
    :style="color ? { borderColor: color, color: active ? '#fff' : color } : {}"
    @click="clickable && $emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.app-chip:hover:not(.chip-static) {
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

.chip-active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: #ffffff !important;
}

.chip-static {
  cursor: default;
}
</style>
