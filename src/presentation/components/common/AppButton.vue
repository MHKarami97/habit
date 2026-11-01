<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    type: 'button'
  }
);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['app-btn', `btn-${variant}`, `btn-${size}`, { 'btn-loading': loading }]"
  >
    <span v-if="loading" class="spinner" />
    <slot />
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all var(--transition-fast);
  min-height: var(--touch-target-min);
  padding: 0 var(--spacing-md);
  cursor: pointer;
  white-space: nowrap;
}

.btn-sm {
  min-height: 36px;
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.btn-md {
  min-height: 44px;
  padding: 0 var(--spacing-md);
  font-size: var(--font-size-base);
}

.btn-lg {
  min-height: 52px;
  padding: 0 var(--spacing-lg);
  font-size: var(--font-size-lg);
}

.btn-primary {
  background-color: var(--color-accent);
  color: #ffffff;
}
.btn-primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
}

.btn-secondary {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-primary);
  border: var(--border-width-regular) solid var(--color-border-subtle);
}
.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-border-subtle);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-text-primary);
  border: var(--border-width-regular) solid var(--color-border-strong);
}
.btn-outline:hover:not(:disabled) {
  background-color: var(--color-bg-surface-soft);
}

.btn-danger {
  background-color: var(--color-danger);
  color: #ffffff;
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}
.btn-ghost:hover:not(:disabled) {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-primary);
}

.app-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
