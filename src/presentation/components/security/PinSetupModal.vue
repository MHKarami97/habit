<script setup lang="ts">
import { ref, computed } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppButton from '../common/AppButton.vue';
import AppInput from '../common/AppInput.vue';
import AppIcon from '../common/AppIcon.vue';
import { useAppLockStore } from '../../stores/useAppLockStore';

const props = defineProps<{
  isOpen: boolean;
  mode: 'setup' | 'change' | 'remove';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const appLockStore = useAppLockStore();

const currentPin = ref('');
const newPin = ref('');
const confirmPin = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const modalTitle = computed(() => {
  switch (props.mode) {
    case 'setup':
      return 'فعال‌سازی قفل ورود (PIN)';
    case 'change':
      return 'تغییر پین ورود';
    case 'remove':
      return 'غیرفعال‌سازی قفل ورود';
    default:
      return 'قفل ورود';
  }
});

const resetForm = () => {
  currentPin.value = '';
  newPin.value = '';
  confirmPin.value = '';
  errorMessage.value = '';
  isSubmitting.value = false;
};

const handleClose = () => {
  resetForm();
  emit('close');
};

const handleSubmit = async () => {
  errorMessage.value = '';

  // ۱. اعتبارسنجی پین فعلی در حالت تغییر یا حذف
  if (props.mode === 'change' || props.mode === 'remove') {
    if (!currentPin.value || currentPin.value.length < 4) {
      errorMessage.value = 'لطفاً پین فعلی خود را وارد کنید.';
      return;
    }
  }

  // ۲. اعتبارسنجی پین جدید در حالت تنظیم یا تغییر
  if (props.mode === 'setup' || props.mode === 'change') {
    if (!newPin.value || newPin.value.length < 4 || newPin.value.length > 6) {
      errorMessage.value = 'پین جدید باید بین ۴ تا ۶ رقم عددی باشد.';
      return;
    }
    if (!/^\d+$/.test(newPin.value)) {
      errorMessage.value = 'پین فقط باید شامل ارقام عددی باشد.';
      return;
    }
    if (newPin.value !== confirmPin.value) {
      errorMessage.value = 'پین جدید با تکرار آن یکسان نیست.';
      return;
    }
  }

  isSubmitting.value = true;
  try {
    if (props.mode === 'setup') {
      await appLockStore.setPin(newPin.value);
    } else if (props.mode === 'change') {
      const ok = await appLockStore.changePin(currentPin.value, newPin.value);
      if (!ok) {
        errorMessage.value = 'پین فعلی نادرست است.';
        isSubmitting.value = false;
        return;
      }
    } else if (props.mode === 'remove') {
      const ok = await appLockStore.removePin(currentPin.value);
      if (!ok) {
        errorMessage.value = 'پین فعلی نادرست است.';
        isSubmitting.value = false;
        return;
      }
    }

    emit('success');
    handleClose();
  } catch (err: any) {
    errorMessage.value = err.message || 'خطا در ذخیره‌سازی تنظیمات پین';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal
    :is-open="isOpen"
    :title="modalTitle"
    @close="handleClose"
  >
    <form class="pin-setup-form" @submit.prevent="handleSubmit">
      <!-- راهنمای شفاف امنیتی -->
      <div class="pin-disclaimer-box">
        <div class="disclaimer-header">
          <AppIcon name="alert-triangle" size="18" />
          <span class="disclaimer-title">یادداشت امنیتی بسیار مهم</span>
        </div>
        <p class="disclaimer-text">
          این قفل صرفاً یک حفاظت سطحی و پرده حریم‌خصوصی (Privacy Screen) در برابر نگاه دیگران هنگام باز بودن دستگاه است و امنیت واقعی داده‌های ذخیره‌شده محسوب نمی‌شود؛ زیرا داده‌های مرورگر در IndexedDB بدون رمزگذاری باقی می‌مانند مگر آنکه کل پایگاه داده رمزگذاری شود که به دلیل تاخیر پردازشی در وب فعال نیست.
        </p>
      </div>

      <div v-if="errorMessage" class="form-error-alert" role="alert">
        <AppIcon name="alert-triangle" size="16" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- فیلد پین فعلی -->
      <div v-if="mode === 'change' || mode === 'remove'" class="form-field-group">
        <AppInput
          v-model="currentPin"
          type="password"
          label="پین فعلی"
          placeholder="پین فعلی ۴ تا ۶ رقمی"
          maxlength="6"
          inputmode="numeric"
          autocomplete="off"
          required
        />
      </div>

      <!-- فیلدهای پین جدید و تکرار آن -->
      <template v-if="mode === 'setup' || mode === 'change'">
        <div class="form-field-group">
          <AppInput
            v-model="newPin"
            type="password"
            label="پین جدید (۴ تا ۶ رقم)"
            placeholder="مثلاً ۱۲۳۴"
            maxlength="6"
            inputmode="numeric"
            autocomplete="off"
            required
          />
        </div>

        <div class="form-field-group">
          <AppInput
            v-model="confirmPin"
            type="password"
            label="تکرار پین جدید"
            placeholder="مجدداً پین را وارد کنید"
            maxlength="6"
            inputmode="numeric"
            autocomplete="off"
            required
          />
        </div>
      </template>

      <div class="form-actions-row">
        <AppButton variant="secondary" type="button" @click="handleClose">
          انصراف
        </AppButton>
        <AppButton
          :variant="mode === 'remove' ? 'danger' : 'primary'"
          type="submit"
          :loading="isSubmitting"
        >
          {{ mode === 'remove' ? 'حذف و غیرفعال‌سازی' : 'تایید و ذخیره' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
.pin-setup-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.pin-disclaimer-box {
  background: var(--color-bg-hover, #fdf8f5);
  border: 1px solid var(--color-border, #f0dfd5);
  border-radius: 8px;
  padding: 0.85rem 1rem;
}

.disclaimer-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary, #d2532a);
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
}

.disclaimer-text {
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--color-text-muted, #7c726d);
  margin: 0;
}

.form-error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fde8e8;
  color: var(--color-danger, #d32f2f);
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.form-field-group {
  display: flex;
  flex-direction: column;
}

.form-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #e5ded8);
}
</style>
