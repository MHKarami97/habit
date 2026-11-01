<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAppLockStore } from '../../stores/useAppLockStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import AppIcon from '../common/AppIcon.vue';

const appLockStore = useAppLockStore();
const { localizeDigits } = usePersianCalendar();

const enteredDigits = ref<string>('');
const errorMessage = ref<string>('');
const isShaking = ref(false);

const appendDigit = async (d: string) => {
  if (appLockStore.isTemporarilyBlocked || enteredDigits.value.length >= 6) return;

  enteredDigits.value += d;
  errorMessage.value = '';

  // اگر حداقل ۴ رقم شد و کاربر مکث کرد یا به ۶ رقم رسید، راستی‌آزمایی شود
  if (enteredDigits.value.length >= 4) {
    if (enteredDigits.value.length === 4 || enteredDigits.value.length === 6) {
      await attemptUnlock();
    }
  }
};

const removeDigit = () => {
  if (appLockStore.isTemporarilyBlocked || enteredDigits.value.length === 0) return;
  enteredDigits.value = enteredDigits.value.slice(0, -1);
  errorMessage.value = '';
};

const clearDigits = () => {
  enteredDigits.value = '';
  errorMessage.value = '';
};

const attemptUnlock = async () => {
  if (enteredDigits.value.length < 4) return;

  const result = await appLockStore.unlock(enteredDigits.value);
  if (!result.success) {
    errorMessage.value = result.message || 'پین واردشده نادرست است';
    triggerShake();
    enteredDigits.value = '';
  } else {
    enteredDigits.value = '';
    errorMessage.value = '';
  }
};

const triggerShake = () => {
  isShaking.value = true;
  setTimeout(() => {
    isShaking.value = false;
  }, 500);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!appLockStore.isLocked) return;

  if (e.key >= '0' && e.key <= '9') {
    appendDigit(e.key);
  } else if (e.key === 'Backspace') {
    removeDigit();
  } else if (e.key === 'Escape') {
    clearDigits();
  } else if (e.key === 'Enter') {
    attemptUnlock();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div
    v-if="appLockStore.isLocked"
    class="pin-lock-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="قفل برنامه"
  >
    <div class="lock-card" :class="{ 'shake-anim': isShaking }">
      <div class="lock-header">
        <div class="lock-icon-circle">
          <AppIcon name="lock" size="32" />
        </div>
        <h1 class="lock-title">کاوش قفل است</h1>
        <p class="lock-subtitle">برای دسترسی به برنامه، پین ورود را وارد کنید</p>
      </div>

      <!-- نشانگر نقاط ارقام واردشده -->
      <div class="pin-dots-container" aria-hidden="true">
        <span
          v-for="i in 6"
          :key="i"
          class="pin-dot"
          :class="{
            'dot-filled': i <= enteredDigits.length,
            'dot-error': Boolean(errorMessage)
          }"
        ></span>
      </div>

      <!-- پیام خطا یا شمارش معکوس مسدودسازی -->
      <div v-if="appLockStore.isTemporarilyBlocked" class="lock-error-alert" role="alert">
        <AppIcon name="alert-triangle" size="16" />
        <span>مسدود موقت: {{ localizeDigits(appLockStore.remainingLockoutSeconds) }} ثانیه صبر کنید</span>
      </div>
      <div v-else-if="errorMessage" class="lock-error-alert" role="alert">
        <AppIcon name="alert-triangle" size="16" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- کیپد لمسی و کلیکی اعداد -->
      <div class="keypad-grid" :class="{ 'keypad-disabled': appLockStore.isTemporarilyBlocked }">
        <button
          v-for="digit in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
          :key="digit"
          type="button"
          class="key-btn"
          :disabled="appLockStore.isTemporarilyBlocked"
          @click="appendDigit(digit)"
        >
          {{ localizeDigits(digit) }}
        </button>

        <button
          type="button"
          class="key-btn key-action"
          :disabled="appLockStore.isTemporarilyBlocked || enteredDigits.length === 0"
          aria-label="پاک کردن همه"
          @click="clearDigits"
        >
          پاک
        </button>

        <button
          type="button"
          class="key-btn"
          :disabled="appLockStore.isTemporarilyBlocked"
          @click="appendDigit('0')"
        >
          {{ localizeDigits('0') }}
        </button>

        <button
          type="button"
          class="key-btn key-action"
          :disabled="appLockStore.isTemporarilyBlocked || enteredDigits.length === 0"
          aria-label="حذف آخرین رقم"
          @click="removeDigit"
        >
          <AppIcon name="backspace" size="22" />
        </button>
      </div>

      <div class="lock-footer-hint">
        <span>می‌توانید از صفحه کلید فیزیکی نیز ارقام را وارد نمایید.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pin-lock-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background-color: var(--color-background, #faf7f2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  user-select: none;
}

.lock-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.lock-header {
  margin-bottom: 2rem;
}

.lock-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary-light, #fbeee8);
  color: var(--color-primary, #d2532a);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.lock-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-main, #201a18);
  margin-bottom: 0.5rem;
}

.lock-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted, #7c726d);
}

.pin-dots-container {
  display: flex;
  gap: 0.85rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.pin-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--color-border, #e5ded8);
  background: transparent;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.pin-dot.dot-filled {
  background: var(--color-primary, #d2532a);
  border-color: var(--color-primary, #d2532a);
  transform: scale(1.15);
}

.pin-dot.dot-error {
  border-color: var(--color-danger, #d32f2f);
}

.lock-error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-danger, #d32f2f);
  background: #fde8e8;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
  width: 100%;
  max-width: 290px;
}

.keypad-disabled {
  opacity: 0.4;
  pointer-events: none;
}

.key-btn {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-text-main, #201a18);
  background: var(--color-card, #ffffff);
  border: 1px solid var(--color-border, #e5ded8);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
  touch-action: manipulation;
}

.key-btn:active {
  transform: scale(0.92);
  background: var(--color-bg-hover, #f3ece6);
}

.key-action {
  font-size: 0.95rem;
  font-weight: 600;
  background: transparent;
  border: none;
  box-shadow: none;
  color: var(--color-text-muted, #7c726d);
}

.key-action:active {
  background: var(--color-bg-hover, #f3ece6);
}

.lock-footer-hint {
  margin-top: 2rem;
  font-size: 0.8rem;
  color: var(--color-text-muted, #a29891);
}

.shake-anim {
  animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(3px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-5px, 0, 0); }
  40%, 60% { transform: translate3d(5px, 0, 0); }
}
</style>
