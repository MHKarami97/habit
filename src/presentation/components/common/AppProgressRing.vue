<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    showLabel?: boolean;
  }>(),
  {
    size: 48,
    strokeWidth: 4,
    showLabel: false
  }
);

const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const strokeDashoffset = computed(() => {
  const clamped = Math.max(0, Math.min(100, props.percentage));
  return circumference.value - (clamped / 100) * circumference.value;
});
</script>

<template>
  <div class="progress-ring-container" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="progress-ring-svg">
      <!-- دایره پس‌زمینه -->
      <circle
        class="progress-ring-bg"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="strokeWidth"
      />
      <!-- دایره پرکننده پیشرفت -->
      <circle
        class="progress-ring-bar"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="strokeWidth"
        :style="{
          strokeDasharray: `${circumference} ${circumference}`,
          strokeDashoffset: `${strokeDashoffset}`,
          stroke: color || 'var(--color-accent)'
        }"
      />
    </svg>
    <span v-if="showLabel" class="progress-ring-label">
      <slot>{{ percentage }}%</slot>
    </span>
  </div>
</template>

<style scoped>
.progress-ring-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.progress-ring-svg {
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: transparent;
  stroke: var(--color-border-subtle);
}

.progress-ring-bar {
  fill: transparent;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--transition-normal);
}

.progress-ring-label {
  position: absolute;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
}
</style>
