<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { BehavioralTip } from '../../data/behavioralTips';
import AppIcon from '../common/AppIcon.vue';

defineProps<{
  tip: BehavioralTip;
}>();

defineEmits<{
  (e: 'dismiss', tipId: string): void;
}>();
</script>

<template>
  <aside
    :class="['behavioral-tip-banner', `tip-${tip.type}`, 'animate-slide-up']"
    role="complementary"
    aria-label="نکته رفتاری هوشمند"
  >
    <div class="tip-icon-col">
      <AppIcon v-if="tip.type === 'encouragement'" name="flame" size="20" class="tip-icon" />
      <AppIcon v-else-if="tip.type === 'warning'" name="alert" size="20" class="tip-icon" />
      <AppIcon v-else-if="tip.type === 'celebration'" name="check" size="20" class="tip-icon" />
      <AppIcon v-else name="info" size="20" class="tip-icon" />
    </div>

    <div class="tip-body-col">
      <div class="tip-header-row">
        <strong class="tip-title">{{ tip.title }}</strong>
        <span class="tip-source-badge">{{ tip.sourceOrTone }}</span>
      </div>

      <p class="tip-message">{{ tip.message }}</p>

      <div v-if="tip.actionLabel && tip.actionRoute" class="tip-action-row">
        <RouterLink :to="tip.actionRoute" class="tip-action-link">
          {{ tip.actionLabel }}
          <AppIcon name="chevron-left" size="14" />
        </RouterLink>
      </div>
    </div>

    <button
      type="button"
      class="tip-dismiss-btn touch-target"
      title="بستن این پیام"
      aria-label="بستن پیام"
      @click="$emit('dismiss', tip.id)"
    >
      <AppIcon name="x" size="16" />
    </button>
  </aside>
</template>

<style scoped>
.behavioral-tip-banner {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-accent);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  position: relative;
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-sm);
}

.tip-encouragement {
  border-color: var(--color-accent);
  background-color: var(--color-accent-subtle);
}

.tip-warning {
  border-color: var(--color-warning);
  background-color: var(--color-warning-subtle);
}

.tip-research_insight {
  border-color: var(--color-border-strong);
  background-color: var(--color-bg-surface-soft);
}

.tip-celebration {
  border-color: var(--color-success);
  background-color: var(--color-success-subtle);
}

.tip-icon-col {
  padding-top: 2px;
  flex-shrink: 0;
}

.tip-icon {
  color: var(--color-accent);
}

.tip-body-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tip-header-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.tip-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.tip-source-badge {
  font-size: 10px;
  font-weight: 700;
  background-color: var(--color-bg-surface);
  color: var(--color-text-secondary);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
}

.tip-message {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.tip-action-row {
  margin-top: 4px;
}

.tip-action-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-accent);
  text-decoration: underline;
  transition: opacity var(--transition-fast);
}

.tip-action-link:hover {
  opacity: 0.8;
}

.tip-dismiss-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.tip-dismiss-btn:hover {
  color: var(--color-text-primary);
}
</style>
