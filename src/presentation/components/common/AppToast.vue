<script setup lang="ts">
import AppIcon from './AppIcon.vue';

withDefaults(
  defineProps<{
    show: boolean;
    type?: 'success' | 'warning' | 'danger' | 'info';
    message: string;
  }>(),
  {
    type: 'info'
  }
);

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <Transition name="toast-anim">
    <div v-if="show" :class="['app-toast', `toast-${type}`]" role="alert">
      <AppIcon
        :name="type === 'danger' || type === 'warning' ? 'alert' : 'check'"
        size="18"
        class="toast-icon"
      />
      <span class="toast-message">{{ message }}</span>
      <button type="button" class="toast-close touch-target" aria-label="بستن" @click="$emit('close')">
        <AppIcon name="x" size="16" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.app-toast {
  position: fixed;
  top: var(--spacing-lg);
  left: var(--spacing-md);
  right: var(--spacing-md);
  max-width: 420px;
  margin: 0 auto;
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-lg);
  z-index: 200;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.toast-success {
  background-color: var(--color-success);
  color: #ffffff;
}

.toast-danger {
  background-color: var(--color-danger);
  color: #ffffff;
}

.toast-warning {
  background-color: var(--color-warning);
  color: #ffffff;
}

.toast-info {
  background-color: var(--color-accent);
  color: #ffffff;
}

.toast-message {
  flex: 1;
}

.toast-close {
  color: rgba(255, 255, 255, 0.8);
  min-height: 32px;
  min-width: 32px;
}
.toast-close:hover {
  color: #ffffff;
}

.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all var(--transition-normal);
}
.toast-anim-enter-from,
.toast-anim-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}
</style>
