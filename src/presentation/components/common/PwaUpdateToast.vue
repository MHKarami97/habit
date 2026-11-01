<script setup lang="ts">
import AppButton from './AppButton.vue';
import AppIcon from './AppIcon.vue';

defineProps<{
  needRefresh: boolean;
}>();

defineEmits<{
  (e: 'update'): void;
  (e: 'close'): void;
}>();
</script>

<template>
  <Transition name="toast-anim">
    <aside v-if="needRefresh" class="pwa-toast-container" role="alert" aria-live="assertive">
      <div class="toast-card">
        <div class="toast-content">
          <AppIcon name="refresh" size="20" class="toast-icon" />
          <div class="toast-text">
            <strong class="toast-title">نسخه جدید کاوش آماده است</strong>
            <p class="toast-desc">جهت اعمال تغییرات و به‌روزرسانی پوسته، برنامه را دوباره بارگذاری کنید.</p>
          </div>
        </div>
        <div class="toast-actions">
          <AppButton variant="primary" size="sm" @click="$emit('update')">
            به‌روزرسانی
          </AppButton>
          <button class="toast-dismiss touch-target" aria-label="بستن" @click="$emit('close')">
            <AppIcon name="x" size="18" />
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.pwa-toast-container {
  position: fixed;
  bottom: calc(64px + var(--safe-area-bottom));
  left: var(--spacing-md);
  right: var(--spacing-md);
  max-width: 460px;
  margin: 0 auto;
  z-index: 100;
}

@media (min-width: 768px) {
  .pwa-toast-container {
    bottom: var(--spacing-lg);
    right: var(--spacing-lg);
    left: auto;
  }
}

.toast-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-regular) solid var(--color-accent);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toast-icon {
  color: var(--color-accent);
}

.toast-text {
  display: flex;
  flex-direction: column;
}

.toast-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.toast-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.toast-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.toast-dismiss {
  color: var(--color-text-muted);
}

.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all var(--transition-normal);
}
.toast-anim-enter-from,
.toast-anim-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
