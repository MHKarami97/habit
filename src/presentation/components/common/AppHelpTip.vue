<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from './AppIcon.vue';

defineProps<{
  tip: string;
  goodExample?: string;
  badExample?: string;
  sourceNote?: string;
}>();

const isOpen = ref(false);
</script>

<template>
  <div class="help-tip-container">
    <button
      type="button"
      class="help-tip-trigger"
      :aria-expanded="isOpen"
      title="راهنما و نمونه"
      @click="isOpen = !isOpen"
    >
      <AppIcon name="info" size="14" />
    </button>

    <div v-if="isOpen" class="help-tip-popover animate-slide-up">
      <div class="tip-content">
        <p class="tip-text">{{ tip }}</p>

        <div v-if="goodExample || badExample" class="examples-box">
          <div v-if="badExample" class="example-item bad">
            <span class="example-tag">❌ نمونه ضعیف:</span>
            <span class="example-text">{{ badExample }}</span>
          </div>
          <div v-if="goodExample" class="example-item good">
            <span class="example-tag">✅ نمونه شفاف:</span>
            <span class="example-text">{{ goodExample }}</span>
          </div>
        </div>

        <p v-if="sourceNote" class="source-citation">
          منبع: {{ sourceNote }}
        </p>
      </div>

      <button type="button" class="tip-close-btn" @click="isOpen = false">
        فهمیدم
      </button>
    </div>
  </div>
</template>

<style scoped>
.help-tip-container {
  display: inline-flex;
  position: relative;
  vertical-align: middle;
  margin-right: var(--spacing-xxs);
}

.help-tip-trigger {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-muted);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  transition: all var(--transition-fast);
}

.help-tip-trigger:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.help-tip-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 280px;
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-sm);
  z-index: 50;
}

.tip-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  line-height: 1.5;
  margin-bottom: var(--spacing-xs);
}

.examples-box {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-xs);
  padding: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.example-item {
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-xs);
}

.example-tag {
  font-weight: 700;
  margin-bottom: 2px;
}

.example-item.bad .example-tag {
  color: var(--color-danger);
}

.example-item.good .example-tag {
  color: var(--color-success);
}

.example-text {
  color: var(--color-text-secondary);
}

.source-citation {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
  margin-bottom: var(--spacing-xs);
}

.tip-close-btn {
  width: 100%;
  padding: 4px 0;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-accent);
  text-align: center;
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
}
</style>
