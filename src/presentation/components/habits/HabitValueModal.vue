<script setup lang="ts">
import { ref, watch } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppButton from '../common/AppButton.vue';
import AppIcon from '../common/AppIcon.vue';
import type { Habit } from '@/domain/entities/Habit';
import { useHabitStore } from '../../stores/useHabitStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

const props = defineProps<{
  isOpen: boolean;
  habit: Habit;
  currentValue: number;
  date: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const habitStore = useHabitStore();
const { localizeDigits } = usePersianCalendar();

const editValue = ref(props.currentValue);
const isSubmitting = ref(false);
const error = ref('');

watch(
  () => [props.isOpen, props.currentValue] as const,
  ([isOpen, val]) => {
    if (isOpen) {
      editValue.value = Number(val) || 0;
      error.value = '';
    }
  },
  { immediate: true }
);

const setDirectValue = (v: number) => {
  editValue.value = Math.max(0, v);
};

const handleAdjust = (delta: number) => {
  editValue.value = Math.max(0, Number(editValue.value || 0) + delta);
};

const handleSubmit = async () => {
  error.value = '';
  const num = Math.max(0, Number(editValue.value) || 0);

  isSubmitting.value = true;
  try {
    await habitStore.checkIn({
      habitId: props.habit.id,
      date: props.date,
      customValue: num
    });
    emit('close');
  } catch (err: any) {
    error.value = err?.message || 'خطا در ثبت مقدار عادت';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal :is-open="isOpen" :title="`ویرایش مقدار: ${habit.title}`" @close="$emit('close')">
    <form class="value-edit-form" @submit.prevent="handleSubmit">
      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="current-info-bar">
        <span>هدف روزانه: <strong>{{ localizeDigits(habit.dailyTarget) }} {{ habit.unit }}</strong></span>
        <span>نوع: <strong>{{ habit.habitType === 'duration' ? 'مدت زمان' : 'تعدادی / مقداری' }}</strong></span>
      </div>

      <AppInput
        v-model.number="editValue"
        type="number"
        min="0"
        :label="`مقدار ثبت‌شده (${habit.unit})`"
        placeholder="مقدار مورد نظر را وارد کنید"
        hint="اگر اشتباه ثبت شده، می‌توانید مقدار را کاهش دهید یا روی ۰ بگذارید."
      />

      <!-- دکمه‌های سریع برای تنظیم آسان با یک لمس -->
      <div class="quick-adjust-chips">
        <button
          type="button"
          class="quick-chip chip-zero touch-target"
          title="برگشت به صفر و لغو کامل"
          @click="setDirectValue(0)"
        >
          <AppIcon name="backspace" size="14" />
          صفر کردن (لغو)
        </button>

        <button
          type="button"
          class="quick-chip touch-target"
          :disabled="editValue <= 0"
          @click="handleAdjust(-1)"
        >
          <AppIcon name="minus" size="14" />
          ۱- {{ habit.unit }}
        </button>

        <button
          type="button"
          class="quick-chip touch-target"
          @click="handleAdjust(1)"
        >
          <AppIcon name="plus" size="14" />
          ۱+ {{ habit.unit }}
        </button>

        <button
          type="button"
          class="quick-chip chip-complete touch-target"
          @click="setDirectValue(habit.dailyTarget)"
        >
          <AppIcon name="check" size="14" />
          تکمیل کامل ({{ localizeDigits(habit.dailyTarget) }})
        </button>
      </div>

      <div class="form-actions">
        <AppButton variant="ghost" size="md" type="button" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" type="submit" :loading="isSubmitting">
          ذخیره مقدار
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
.value-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-error {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
}

.current-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.quick-adjust-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.quick-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quick-chip:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.quick-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chip-zero:hover:not(:disabled) {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background-color: var(--color-danger-subtle);
}

.chip-complete {
  color: var(--color-success);
}
.chip-complete:hover:not(:disabled) {
  border-color: var(--color-success);
  background-color: var(--color-success-subtle);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}
</style>
