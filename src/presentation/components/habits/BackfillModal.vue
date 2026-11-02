<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppButton from '../common/AppButton.vue';
import PersianDatePickerBottomSheet from '../calendar/PersianDatePickerBottomSheet.vue';
import { Habit } from '@/domain/entities/Habit';
import { useHabitStore } from '../../stores/useHabitStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

const props = defineProps<{
  isOpen: boolean;
  habit: Habit | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const habitStore = useHabitStore();
const { effectiveTodayIso, formatShortDate } = usePersianCalendar();

const backfillDate = ref(effectiveTodayIso.value);
const isDatePickerOpen = ref(false);
const isCompleted = ref(true);
const customValue = ref<number>(props.habit?.dailyTarget ?? 1);
const note = ref('');
const isSubmitting = ref(false);
const error = ref('');

const isNumericHabit = computed(() => props.habit && props.habit.habitType !== 'boolean');

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.habit) {
      backfillDate.value = effectiveTodayIso.value;
      customValue.value = props.habit.dailyTarget;
      isCompleted.value = true;
      note.value = '';
      error.value = '';
    }
  }
);

const onValueChange = () => {
  if (props.habit) {
    isCompleted.value = Number(customValue.value) >= props.habit.dailyTarget;
  }
};

const handleSubmit = async () => {
  if (!props.habit) return;
  error.value = '';
  isSubmitting.value = true;
  try {
    const finalValue = isNumericHabit.value ? Math.max(0, Number(customValue.value) || 0) : undefined;
    const finalCompleted = isNumericHabit.value
      ? finalValue! >= props.habit.dailyTarget
      : isCompleted.value;

    await habitStore.backfillLog({
      habitId: props.habit.id,
      date: backfillDate.value,
      isCompleted: finalCompleted,
      value: finalValue,
      note: note.value || undefined,
      todayIso: effectiveTodayIso.value
    });
    emit('close');
  } catch (err: any) {
    error.value = err?.message || 'خطا در ثبت گذشته‌نگار';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal
    :is-open="isOpen"
    :title="habit ? `ثبت روزهای گذشته: ${habit.title}` : 'ثبت روز گذشته'"
    @close="$emit('close')"
  >
    <form class="backfill-form" @submit.prevent="handleSubmit">
      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="field-container">
        <label class="field-label">تاریخ مورد نظر برای ثبت:</label>
        <button type="button" class="date-select-btn" @click="isDatePickerOpen = true">
          {{ formatShortDate(backfillDate) }}
        </button>
      </div>

      <div v-if="isNumericHabit" class="field-container">
        <label class="field-label">
          مقدار انجام‌شده (هدف روزانه: {{ habit?.dailyTarget }} {{ habit?.unit || '' }}):
        </label>
        <AppInput
          v-model.number="customValue"
          type="number"
          min="0"
          placeholder="مثلاً ۰ یا ۱ یا بیشتر"
          @input="onValueChange"
        />
        <span class="value-hint">
          وضعیت: {{ isCompleted ? 'تکمیل‌شده (رسیده به سقف هدف)' : 'ناتمام / کمتر از سقف هدف' }}
        </span>
      </div>

      <label v-else class="checkbox-label">
        <input v-model="isCompleted" type="checkbox" class="app-checkbox" />
        <span>در این روز عادت با موفقیت انجام شد</span>
      </label>

      <AppInput
        v-model="note"
        label="یادداشت روزانه (اختیاری)"
        placeholder="علت ثبت با تأخیر یا توضیحات..."
      />

      <div class="form-actions">
        <AppButton variant="ghost" size="md" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" type="submit" :loading="isSubmitting">
          ثبت لاگ
        </AppButton>
      </div>
    </form>

    <PersianDatePickerBottomSheet
      :is-open="isDatePickerOpen"
      :model-value="backfillDate"
      title="انتخاب روز مورد نظر"
      @update:model-value="backfillDate = $event"
      @close="isDatePickerOpen = false"
    />
  </AppModal>
</template>

<style scoped>
.backfill-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-error {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
}

.field-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.value-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.date-select-btn {
  min-height: var(--touch-target-min);
  padding: 0 var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  text-align: right;
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.app-checkbox {
  accent-color: var(--color-accent);
  width: 18px;
  height: 18px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
