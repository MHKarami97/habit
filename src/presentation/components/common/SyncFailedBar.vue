<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import { useAppLockStore } from '@/presentation/stores/useAppLockStore';
import { useCloudSyncStore } from '@/presentation/stores/useCloudSyncStore';

const store = useCloudSyncStore();
const appLockStore = useAppLockStore();

const dismissedKey = ref('');
const isRetrying = ref(false);

const currentKey = computed(() => `${store.snapshot.status}|${store.snapshot.lastError ?? ''}`);
const isVisible = computed(
  () => store.showFailureBar && !appLockStore.isLocked && dismissedKey.value !== currentKey.value
);

function dismiss() {
  dismissedKey.value = currentKey.value;
}

async function retry() {
  isRetrying.value = true;
  try {
    await store.connect();
  } catch {
    // The failure bar stays visible; store holds latest error
  } finally {
    isRetrying.value = false;
  }
}
</script>

<template>
  <Transition name="slide-bar">
    <div v-if="isVisible" role="status" class="sync-failed-bar">
      <div class="sync-failed-content">
        <div class="sync-failed-text-wrap">
          <AppIcon name="cloud-off" size="18" class="failed-icon" />
          <span class="failed-message">{{ store.failureBarMessage }}</span>
        </div>
        <div class="sync-failed-actions">
          <button
            type="button"
            :disabled="isRetrying"
            class="retry-button"
            @click="retry"
          >
            {{ isRetrying ? 'در حال تلاش...' : 'تلاش دوباره' }}
          </button>
          <button
            type="button"
            class="dismiss-button"
            title="بستن"
            aria-label="بستن"
            @click="dismiss"
          >
            <AppIcon name="x" size="16" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sync-failed-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(56px + var(--safe-area-bottom));
  z-index: 95;
  background-color: var(--color-warning);
  color: #ffffff;
  box-shadow: 0 -4px 16px rgba(45, 30, 20, 0.15);
  transition: bottom 0.25s ease;
}

@media (min-width: 768px) {
  .sync-failed-bar {
    bottom: 0;
  }
}

.sync-failed-content {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-xs) var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.sync-failed-text-wrap {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 0;
}

.failed-icon {
  flex-shrink: 0;
}

.failed-message {
  line-height: var(--line-height-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sync-failed-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.retry-button {
  background-color: #ffffff;
  color: var(--color-warning);
  border: none;
  border-radius: var(--radius-sm);
  padding: 4px var(--spacing-sm);
  font-family: var(--font-family-base);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.retry-button:hover:not(:disabled) {
  background-color: var(--color-bg-surface-soft);
}

.retry-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dismiss-button {
  background: none;
  border: none;
  color: #ffffff;
  opacity: 0.8;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: var(--radius-xs);
}

.dismiss-button:hover {
  opacity: 1;
}

/* Transitions */
.slide-bar-enter-active,
.slide-bar-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-bar-enter-from,
.slide-bar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
