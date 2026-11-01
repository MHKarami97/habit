<script setup lang="ts">
import AppIcon from './AppIcon.vue';

defineProps<{
  isOpen: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const onBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close');
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-anim">
      <div v-if="isOpen" class="sheet-backdrop" @click="onBackdropClick">
        <div class="sheet-panel" role="dialog" aria-modal="true">
          <!-- Grab Handle for visual affordance -->
          <div class="sheet-handle-bar">
            <div class="sheet-handle" />
          </div>

          <header v-if="title || $slots.header" class="sheet-header">
            <h3 class="sheet-title">{{ title }}</h3>
            <button
              class="close-btn touch-target"
              aria-label="بستن"
              @click="$emit('close')"
            >
              <AppIcon name="x" size="20" />
            </button>
          </header>

          <div class="sheet-content">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="sheet-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.sheet-panel {
  background-color: var(--color-bg-surface);
  border-top-left-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-xl);
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
  box-shadow: var(--shadow-sheet);
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding-bottom: max(var(--spacing-md), var(--safe-area-bottom));
  overflow: hidden;
}

.sheet-handle-bar {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-xs);
  padding-bottom: var(--spacing-xxs);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: var(--radius-full);
  background-color: var(--color-border-strong);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-lg) var(--spacing-sm);
  border-bottom: var(--border-width-hairline) solid var(--color-border-subtle);
}

.sheet-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
}

.close-btn {
  color: var(--color-text-muted);
}

.sheet-content {
  padding: var(--spacing-md) var(--spacing-lg);
  overflow-y: auto;
}

.sheet-footer {
  padding: var(--spacing-sm) var(--spacing-lg) 0;
}

/* ترنزیشن انیمیشن باتم‌شیت */
.sheet-anim-enter-active,
.sheet-anim-leave-active {
  transition: opacity var(--transition-normal);
}
.sheet-anim-enter-active .sheet-panel,
.sheet-anim-leave-active .sheet-panel {
  transition: transform var(--transition-normal);
}

.sheet-anim-enter-from {
  opacity: 0;
}
.sheet-anim-enter-from .sheet-panel {
  transform: translateY(100%);
}

.sheet-anim-leave-to {
  opacity: 0;
}
.sheet-anim-leave-to .sheet-panel {
  transform: translateY(100%);
}
</style>
