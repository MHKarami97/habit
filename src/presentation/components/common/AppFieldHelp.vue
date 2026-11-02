<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  tip: string;
  goodExample?: string;
  badExample?: string;
  sourceNote?: string;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const placement = ref<'right' | 'left'>('right');

const toggle = () => {
  if (!isOpen.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    // در چیدمان راست‌به‌چپ، اگر آیکون نزدیک لبه چپ صفحه باشد، باز شدن به چپ باعث بیرون افتادن از صفحه می‌شود.
    // بنابراین اگر فاصله از لبه چپ کمتر از ۲۹۰ پیکسل باشد، راست‌چین باز شود (place-left) تا به سمت داخل کادر گسترش یابد.
    if (rect.right < 290) {
      placement.value = 'left';
    } else {
      placement.value = 'right';
    }
  }
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <div ref="containerRef" class="field-help-container">
    <button
      type="button"
      class="help-button touch-target"
      :aria-expanded="isOpen"
      title="راهنما و نمونه‌های صحیح"
      @click="toggle"
    >
      ؟
    </button>

    <div
      v-if="isOpen"
      :class="['help-popover animate-slide-up', `place-${placement}`]"
    >
      <div class="popover-body">
        <p class="popover-tip">{{ tip }}</p>

        <div v-if="goodExample || badExample" class="examples-box">
          <div v-if="badExample" class="example-item bad">
            <span class="example-label">❌ نمونه نامناسب:</span>
            <span class="example-val">{{ badExample }}</span>
          </div>
          <div v-if="goodExample" class="example-item good">
            <span class="example-label">✅ نمونه مشخص و هدفمند:</span>
            <span class="example-val">{{ goodExample }}</span>
          </div>
        </div>

        <p v-if="sourceNote" class="source-tag">
          منبع: {{ sourceNote }}
        </p>
      </div>

      <button type="button" class="popover-close-btn" @click="isOpen = false">
        بستن راهنما
      </button>
    </div>
  </div>
</template>

<style scoped>
.field-help-container {
  display: inline-flex;
  position: relative;
  vertical-align: middle;
  margin-right: var(--spacing-xxs);
}

.help-button {
  width: 22px;
  height: 22px;
  min-height: 22px;
  min-width: 22px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-secondary);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.help-button:hover {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.help-popover {
  position: absolute;
  top: calc(100% + 6px);
  width: 280px;
  max-width: calc(100vw - 32px);
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-sm);
  z-index: 100;
  box-sizing: border-box;
}

.help-popover.place-right {
  right: 0;
  left: auto;
}

.help-popover.place-left {
  left: 0;
  right: auto;
}

@media (max-width: 600px) {
  .help-popover {
    position: fixed;
    top: auto;
    bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    right: 16px;
    left: 16px;
    width: auto;
    max-width: none;
    z-index: 1200;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  }
}

.popover-tip {
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

.example-label {
  font-weight: 700;
  margin-bottom: 2px;
}

.example-item.bad .example-label {
  color: var(--color-danger);
}

.example-item.good .example-label {
  color: var(--color-success);
}

.example-val {
  color: var(--color-text-secondary);
}

.source-tag {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
  margin-bottom: var(--spacing-xs);
}

.popover-close-btn {
  width: 100%;
  padding: 6px 0;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-accent);
  text-align: center;
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
  cursor: pointer;
}
</style>
