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
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-backdrop" @click="onBackdropClick">
        <div class="modal-container" role="dialog" aria-modal="true">
          <header v-if="title || $slots.header" class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button
              class="close-btn touch-target"
              aria-label="بستن"
              @click="$emit('close')"
            >
              <AppIcon name="x" size="20" />
            </button>
          </header>

          <div class="modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
  backdrop-filter: blur(2px);
}

.modal-container {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--border-width-hairline) solid var(--color-border-subtle);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
}

.close-btn {
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.modal-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
  background-color: var(--color-bg-surface-soft);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity var(--transition-normal);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
