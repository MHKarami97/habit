<script setup lang="ts">
import { ref } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppSelect from '../common/AppSelect.vue';
import AppButton from '../common/AppButton.vue';
import AppHelpTip from '../common/AppHelpTip.vue';
import PersianDatePickerBottomSheet from '../calendar/PersianDatePickerBottomSheet.vue';
import { GoalPriority } from '@/domain/value-objects/GoalPriority';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const goalStore = useGoalStore();
const { effectiveTodayIso, formatShortDate } = usePersianCalendar();

const title = ref('');
const whyStatement = ref('');
const priority = ref<GoalPriority>('medium');
const status = ref<GoalStatus>('active');
const targetStartDate = ref(effectiveTodayIso.value);
const deadline = ref(effectiveTodayIso.value);
const startValue = ref(0);
const targetValue = ref(10);
const unit = ref('مورد');

// کنترل باز شدن DatePicker
const isStartDatePickerOpen = ref(false);
const isDeadlinePickerOpen = ref(false);
const isSubmitting = ref(false);
const formError = ref('');

const priorityOptions = [
  { value: 'low', label: 'پایین' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'بالا (ضروری)' }
];

const statusOptions = [
  { value: 'active', label: 'فعال (آغاز اقدام)' },
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'scheduled', label: 'برنامه‌ریزی‌شده برای آینده' }
];

const handleSubmit = async () => {
  formError.value = '';
  if (!title.value.trim()) {
    formError.value = 'لطفاً عنوان مشخص هدف را بنویسید.';
    return;
  }
  if (!whyStatement.value.trim()) {
    formError.value = 'بیان دلیل و چرایی هدف (Why) برای پایداری انگیزه الزامی است.';
    return;
  }
  if (!deadline.value) {
    formError.value = 'تعیین مهلت پایان هدف الزامی است.';
    return;
  }

  isSubmitting.value = true;
  try {
    await goalStore.createGoal({
      title: title.value,
      whyStatement: whyStatement.value,
      priority: priority.value,
      status: status.value,
      targetStartDate: targetStartDate.value,
      deadline: deadline.value,
      startValue: Number(startValue.value),
      targetValue: Number(targetValue.value),
      unit: unit.value
    });

    // ریست فرم
    title.value = '';
    whyStatement.value = '';
    emit('close');
  } catch (err: any) {
    formError.value = err?.message || 'خطایی در ثبت هدف رخ داد';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal :is-open="isOpen" title="تعریف هدف جدید" @close="$emit('close')">
    <form class="goal-form" @submit.prevent="handleSubmit">
      <p v-if="formError" class="form-error-banner">{{ formError }}</p>

      <!-- فیلد عنوان با راهنما و نمونه -->
      <div class="field-container">
        <div class="label-with-tip">
          <label class="field-label">عنوان شفاف هدف *</label>
          <AppHelpTip
            tip="هدفی اثربخش است که نتیجه نهایی آن واضح، سنجش‌پذیر و زمان‌دار باشد."
            good-example="تا پایان دی، ۸ کیلوگرم کاهش وزن داشته باشم"
            bad-example="ورزش کنم و لاغر شوم"
          />
        </div>
        <AppInput
          v-model="title"
          placeholder="مثلاً: قبولی در آزمون زبان تا پایان بهمن"
          required
        />
      </div>

      <!-- فیلد چرایی با راهنما -->
      <div class="field-container">
        <div class="label-with-tip">
          <label class="field-label">دلیل و انگیزه اصلی (Why) *</label>
          <AppHelpTip
            tip="دلیل عمیق رسیدن به این هدف چیست؟ در روزهای بی‌انگیزگی، این متن به شما یادآوری می‌کند چرا شروع کردید."
            good-example="برای اینکه بتوانم موقعیت شغلی بین‌المللی به دست آورم و مستقل شوم"
            bad-example="چون بقیه هم زبان می‌خوانند"
          />
        </div>
        <textarea
          v-model="whyStatement"
          class="app-textarea"
          rows="2"
          placeholder="علت اهمیت این هدف برای شما..."
          required
        />
      </div>

      <!-- اولویت و وضعیت اولیه -->
      <div class="form-row">
        <AppSelect v-model="priority" :options="priorityOptions" label="اولویت" />
        <AppSelect v-model="status" :options="statusOptions" label="وضعیت آغاز" />
      </div>

      <!-- سنجه عددی موفقیت -->
      <div class="form-row">
        <AppInput v-model.number="startValue" type="number" label="مقدار شروع" />
        <AppInput v-model.number="targetValue" type="number" label="مقدار هدف" />
        <AppInput v-model="unit" label="واحد سنجه (صفحه، کیلو و...)" />
      </div>

      <!-- تاریخ شروع و مهلت -->
      <div class="form-row">
        <div class="date-picker-trigger-col">
          <label class="field-label">تاریخ شروع</label>
          <button type="button" class="date-btn" @click="isStartDatePickerOpen = true">
            {{ formatShortDate(targetStartDate) }}
          </button>
        </div>

        <div class="date-picker-trigger-col">
          <label class="field-label">مهلت دستیابی *</label>
          <button type="button" class="date-btn" @click="isDeadlinePickerOpen = true">
            {{ formatShortDate(deadline) }}
          </button>
        </div>
      </div>

      <div class="form-actions">
        <AppButton variant="ghost" size="md" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" type="submit" :loading="isSubmitting">
          ذخیره هدف
        </AppButton>
      </div>
    </form>

    <!-- پیکرهای تقویم شمسی -->
    <PersianDatePickerBottomSheet
      :is-open="isStartDatePickerOpen"
      :model-value="targetStartDate"
      title="انتخاب تاریخ شروع هدف"
      @update:model-value="targetStartDate = $event"
      @close="isStartDatePickerOpen = false"
    />

    <PersianDatePickerBottomSheet
      :is-open="isDeadlinePickerOpen"
      :model-value="deadline"
      title="انتخاب مهلت پایان هدف"
      @update:model-value="deadline = $event"
      @close="isDeadlinePickerOpen = false"
    />
  </AppModal>
</template>

<style scoped>
.goal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-error-banner {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
  border: var(--border-width-hairline) solid var(--color-danger);
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.field-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.label-with-tip {
  display: flex;
  align-items: center;
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.app-textarea {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  resize: vertical;
}
.app-textarea:focus {
  border-color: var(--color-accent);
  background-color: var(--color-bg-surface);
}

.form-row {
  display: flex;
  gap: var(--spacing-sm);
}
@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
  }
}

.date-picker-trigger-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  flex: 1;
}

.date-btn {
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
.date-btn:hover {
  border-color: var(--color-border-strong);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
