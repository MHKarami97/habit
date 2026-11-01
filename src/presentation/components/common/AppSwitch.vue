<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    label?: string;
    description?: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false
  }
);

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();
</script>

<template>
  <label :class="['switch-wrapper', { 'switch-disabled': disabled }]">
    <div class="switch-labels">
      <span v-if="label" class="switch-title">{{ label }}</span>
      <span v-if="description" class="switch-desc">{{ description }}</span>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      :class="['switch-track', { 'switch-on': modelValue }]"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <span class="switch-thumb" />
    </button>
  </label>
</template>

<style scoped>
.switch-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  cursor: pointer;
  min-height: var(--touch-target-min);
}

.switch-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-labels {
  display: flex;
  flex-direction: column;
}

.switch-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.switch-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.switch-track {
  width: 48px;
  height: 28px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-regular) solid var(--color-border-strong);
  position: relative;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  padding: 0;
}

.switch-on {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
}

.switch-thumb {
  position: absolute;
  top: 2px;
  right: 2px; /* RTL placement */
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background-color: #ffffff;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}

.switch-on .switch-thumb {
  transform: translateX(-20px); /* In RTL, moves to the left */
}
</style>
