<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    percentage: number;
    color?: string;
    height?: number;
  }>(),
  {
    height: 6
  }
);

const clampedPercentage = computed(() => Math.max(0, Math.min(100, props.percentage)));
</script>

<template>
  <div class="progress-bar-track" :style="{ height: `${height}px` }">
    <div
      class="progress-bar-fill"
      :style="{
        width: `${clampedPercentage}%`,
        backgroundColor: color || 'var(--color-accent)'
      }"
    />
  </div>
</template>

<style scoped>
.progress-bar-track {
  width: 100%;
  background-color: var(--color-bg-surface-elevated);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}
</style>
