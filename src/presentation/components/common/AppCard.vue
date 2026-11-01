<script setup lang="ts">
withDefaults(
  defineProps<{
    interactive?: boolean;
    elevated?: boolean;
  }>(),
  {
    interactive: false,
    elevated: false
  }
);
</script>

<template>
  <div :class="['app-card', { 'card-interactive': interactive, 'card-elevated': elevated }]">
    <slot />
  </div>
</template>

<style scoped>
.app-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
}

.card-elevated {
  box-shadow: var(--shadow-md);
  background-color: var(--color-bg-surface-elevated);
}

.card-interactive {
  cursor: pointer;
}
.card-interactive:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
</style>
