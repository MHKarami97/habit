<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    rows?: number;
    required?: boolean;
    error?: string;
    hint?: string;
  }>(),
  {
    rows: 3,
    required: false
  }
);

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="textarea-group">
    <label v-if="label" class="textarea-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <div class="textarea-wrapper">
      <textarea
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :required="required"
        :class="['app-textarea', { 'textarea-has-error': error }]"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <span v-if="error" class="textarea-error">{{ error }}</span>
    <span v-else-if="hint" class="textarea-hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.textarea-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  width: 100%;
}

.textarea-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.required-star {
  color: var(--color-danger);
}

.textarea-wrapper {
  position: relative;
}

.app-textarea {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  resize: vertical;
  transition: border-color var(--transition-fast);
}

.app-textarea:focus {
  border-color: var(--color-accent);
  background-color: var(--color-bg-surface);
}

.textarea-has-error {
  border-color: var(--color-danger);
}

.textarea-error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.textarea-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
