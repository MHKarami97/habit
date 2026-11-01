<script setup lang="ts">
interface SelectOption {
  value: string | number;
  label: string;
}

defineProps<{
  modelValue: string | number;
  options: readonly SelectOption[];
  label?: string;
  required?: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="select-group">
    <label v-if="label" class="select-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>
    <div class="select-wrapper">
      <select
        :value="modelValue"
        class="app-select"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.select-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  width: 100%;
}

.select-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.required-star {
  color: var(--color-danger);
}

.select-wrapper {
  position: relative;
}

.app-select {
  width: 100%;
  min-height: var(--touch-target-min);
  padding: 0 var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B5E55' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: left 12px center;
  background-size: 16px;
  cursor: pointer;
}

.app-select:focus {
  border-color: var(--color-accent);
  background-color: var(--color-bg-surface);
}
</style>
