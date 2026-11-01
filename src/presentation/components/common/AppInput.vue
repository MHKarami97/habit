<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string | number;
    label?: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
    error?: string;
    hint?: string;
  }>(),
  {
    type: 'text',
    required: false
  }
);

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="input-group">
    <label v-if="label" class="input-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>
    <div class="input-wrapper">
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :class="['app-input', { 'input-has-error': error }]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <slot name="suffix" />
    </div>
    <span v-if="error" class="input-error">{{ error }}</span>
    <span v-else-if="hint" class="input-hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  width: 100%;
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.required-star {
  color: var(--color-danger);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.app-input {
  width: 100%;
  min-height: var(--touch-target-min);
  padding: 0 var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
}

.app-input:focus {
  border-color: var(--color-accent);
  background-color: var(--color-bg-surface);
}

.input-has-error {
  border-color: var(--color-danger);
}

.input-error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.input-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
